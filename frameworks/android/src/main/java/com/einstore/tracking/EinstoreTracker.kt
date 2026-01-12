package com.einstore.tracking

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.UUID
import java.util.concurrent.Executor
import java.util.concurrent.Executors

enum class EinstoreService(val key: String) {
  ANALYTICS("analytics"),
  ERRORS("errors"),
  DISTRIBUTION("distribution"),
  DEVICES("devices"),
  USAGE("usage"),
  CRASHES("crashes");

  companion object {
    fun defaults(): Set<EinstoreService> = setOf(DISTRIBUTION, DEVICES)
  }
}

data class EinstoreTrackingConfig(
  val baseUrl: String? = "https://api.einstore.dev",
  val buildId: String? = null,
  val downloadUrl: String? = null,
  val launchUrl: String? = null,
  val eventUrl: String? = null,
  val headers: Map<String, String> = emptyMap(),
  val platform: String = "android",
  val targetId: String? = null,
  val deviceId: String? = null,
  val metadata: Map<String, Any?> = emptyMap(),
  val services: Set<EinstoreService> = EinstoreService.defaults(),
  val distributionInfo: Map<String, Any?> = emptyMap(),
  val deviceInfo: Map<String, Any?> = emptyMap(),
  val launchKey: String? = null,
  val crashEnabled: Boolean = false
)

class EinstoreTracker(
  context: Context,
  private val config: EinstoreTrackingConfig,
  private val executor: Executor = Executors.newSingleThreadExecutor()
) {
  private data class AnalyticsEvent(val name: String, val properties: Map<String, Any?>)
  private data class ErrorInfo(val message: String, val stackTrace: String?, val properties: Map<String, Any?>)

  private val appContext = context.applicationContext
  private val preferences = appContext.getSharedPreferences("einstore_tracking", Context.MODE_PRIVATE)
  private val crashKey = "einstore_crashes"
  private var sessionId = UUID.randomUUID().toString()
  private var sessionStartMs = System.currentTimeMillis()
  private val userProperties = mutableMapOf<String, Any?>()

  init {
    if (config.crashEnabled && config.services.contains(EinstoreService.CRASHES)) {
      uploadPendingCrashes()
    }
  }

  fun startNewSession() {
    sessionId = UUID.randomUUID().toString()
    sessionStartMs = System.currentTimeMillis()
  }

  fun setUserProperties(properties: Map<String, Any?>) {
    userProperties.putAll(properties)
  }

  fun trackDownload(callback: ((Result<Unit>) -> Unit)? = null) {
    trackAsync(resolvedDownloadUrl(), requiredService = EinstoreService.DISTRIBUTION, callback = callback)
  }

  fun trackLaunch(callback: ((Result<Unit>) -> Unit)? = null) {
    startNewSession()
    trackAsync(
      resolvedLaunchUrl(),
      event = AnalyticsEvent("app_launch", emptyMap()),
      requiredService = EinstoreService.ANALYTICS,
      callback = callback
    )
  }

  fun trackLaunchOnce(callback: ((Result<Unit>) -> Unit)? = null) {
    val key = resolveLaunchKey()
    if (preferences.getBoolean(key, false)) {
      callback?.invoke(Result.success(Unit))
      return
    }
    trackLaunch { result ->
      if (result.isSuccess) {
        preferences.edit().putBoolean(key, true).apply()
      }
      callback?.invoke(result)
    }
  }

  fun trackScreenView(
    screenName: String,
    properties: Map<String, Any?> = emptyMap(),
    callback: ((Result<Unit>) -> Unit)? = null
  ) {
    val payload = properties.toMutableMap()
    payload["screen"] = screenName
    trackAsync(
      resolvedEventUrl(),
      event = AnalyticsEvent("screen_view", payload),
      requiredService = EinstoreService.ANALYTICS,
      callback = callback
    )
  }

  fun trackEvent(
    name: String,
    properties: Map<String, Any?> = emptyMap(),
    callback: ((Result<Unit>) -> Unit)? = null
  ) {
    trackAsync(
      resolvedEventUrl(),
      event = AnalyticsEvent(name, properties),
      requiredService = EinstoreService.ANALYTICS,
      callback = callback
    )
  }

  fun trackError(
    message: String,
    stackTrace: String? = null,
    properties: Map<String, Any?> = emptyMap(),
    callback: ((Result<Unit>) -> Unit)? = null
  ) {
    trackAsync(
      resolvedEventUrl(),
      errorInfo = ErrorInfo(message, stackTrace, properties),
      requiredService = EinstoreService.ERRORS,
      callback = callback
    )
  }

  fun recordCrash(crash: Map<String, Any?>) {
    if (!config.crashEnabled || !config.services.contains(EinstoreService.CRASHES)) return
    val existing = pendingCrashes().toMutableList()
    existing.add(crash)
    preferences.edit().putString(crashKey, JSONArray(existing).toString()).apply()
  }

  fun uploadPendingCrashes(callback: ((Result<Unit>) -> Unit)? = null) {
    if (!config.crashEnabled || !config.services.contains(EinstoreService.CRASHES)) {
      callback?.invoke(Result.success(Unit))
      return
    }
    val crashes = pendingCrashes()
    if (crashes.isEmpty()) {
      callback?.invoke(Result.success(Unit))
      return
    }
    val results = mutableListOf<Result<Unit>>()
    crashes.forEach { crash ->
      trackAsync(resolvedEventUrl(), crash = crash, requiredService = EinstoreService.CRASHES) {
        results.add(it)
        if (results.size == crashes.size) {
          if (results.any { res -> res.isFailure }) {
            callback?.invoke(results.first { it.isFailure })
          } else {
            preferences.edit().remove(crashKey).apply()
            callback?.invoke(Result.success(Unit))
          }
        }
      }
    }
  }

  private fun resolvedDownloadUrl(): String? {
    return resolveUrl(config.downloadUrl, "builds/{id}/downloads")
  }

  private fun resolvedLaunchUrl(): String? {
    return resolveUrl(config.launchUrl, "builds/{id}/installs")
  }

  private fun resolvedEventUrl(): String? {
    return resolveUrl(config.eventUrl, "builds/{id}/events") ?: resolveUrl(config.launchUrl, "builds/{id}/installs")
  }

  private fun resolveUrl(provided: String?, defaultPath: String): String? {
    if (!provided.isNullOrBlank()) {
      return provided
    }
    val base = config.baseUrl
    if (base.isNullOrBlank()) {
      return null
    }
    val buildId = config.buildId
    val path = if (!buildId.isNullOrBlank()) {
      defaultPath.replace("{id}", buildId)
    } else {
      "tracking/events"
    }
    return if (base.endsWith("/")) base + path else "$base/$path"
  }

  private fun trackAsync(
    url: String?,
    event: AnalyticsEvent? = null,
    errorInfo: ErrorInfo? = null,
    crash: Map<String, Any?>? = null,
    requiredService: EinstoreService? = null,
    callback: ((Result<Unit>) -> Unit)?
  ) {
    if (url.isNullOrBlank()) {
      callback?.invoke(Result.failure(IllegalStateException("Tracking URL is required")))
      return
    }
    if (requiredService != null && !config.services.contains(requiredService)) {
      callback?.invoke(Result.failure(IllegalStateException("Service ${requiredService.key} is disabled")))
      return
    }
    executor.execute {
      callback?.invoke(post(url, event, errorInfo, crash))
    }
  }

  private fun post(url: String, event: AnalyticsEvent?, errorInfo: ErrorInfo?, crash: Map<String, Any?>?): Result<Unit> {
    return try {
      val payload = buildPayload(event, errorInfo, crash)
      val connection = URL(url).openConnection() as HttpURLConnection
      connection.requestMethod = "POST"
      connection.doOutput = true
      connection.setRequestProperty("Content-Type", "application/json")
      for ((key, value) in config.headers) {
        connection.setRequestProperty(key, value)
      }
      connection.outputStream.use { output ->
        output.write(payload.toByteArray(Charsets.UTF_8))
      }
      val status = connection.responseCode
      val stream = if (status in 200..299) connection.inputStream else connection.errorStream
      stream?.use { it.readBytes() }
      if (status in 200..299) {
        Result.success(Unit)
      } else {
        Result.failure(IllegalStateException("Tracking failed with status $status"))
      }
    } catch (ex: Exception) {
      Result.failure(ex)
    }
  }

  private fun buildPayload(event: AnalyticsEvent?, errorInfo: ErrorInfo?, crash: Map<String, Any?>?): String {
    val root = JSONObject()
    root.put("platform", config.platform)
    resolveDeviceId()?.let { root.put("deviceId", it) }
    resolveTargetId()?.let { root.put("targetId", it) }

    val metadata = JSONObject()
    metadata.put("services", JSONArray(config.services.map { it.key }))

    if (config.services.contains(EinstoreService.ANALYTICS)) {
      val analytics = JSONObject()
      if (event != null) {
        analytics.put("event", JSONObject().apply {
          put("name", event.name)
          if (event.properties.isNotEmpty()) {
            put("properties", mapToJson(event.properties))
          }
        })
      }
      if (userProperties.isNotEmpty()) {
        analytics.put("userProperties", mapToJson(userProperties))
      }
      analytics.put("session", sessionPayload())
      if (analytics.length() > 0) {
        metadata.put("analytics", analytics)
      }
    }

    if (config.services.contains(EinstoreService.ERRORS) && errorInfo != null) {
      val errorPayload = JSONObject().apply {
        put("message", errorInfo.message)
        if (!errorInfo.stackTrace.isNullOrBlank()) {
          put("stackTrace", errorInfo.stackTrace)
        }
        if (errorInfo.properties.isNotEmpty()) {
          put("properties", mapToJson(errorInfo.properties))
        }
      }
      metadata.put("errors", errorPayload)
    }

    if (config.services.contains(EinstoreService.DISTRIBUTION)) {
      val distribution = distributionPayload()
      if (distribution.length() > 0) {
        metadata.put("distribution", distribution)
      }
    }

    if (config.services.contains(EinstoreService.DEVICES)) {
      val device = devicePayload()
      if (device.length() > 0) {
        metadata.put("device", device)
      }
    }

    if (config.services.contains(EinstoreService.USAGE)) {
      metadata.put("usage", usagePayload())
    }

    if (config.services.contains(EinstoreService.CRASHES) && crash != null) {
      val crashPayload = mapToJson(crash.toMutableMap().apply {
        putIfAbsent("platform", config.platform)
        if (!containsKey("appVersion")) {
          put("appVersion", resolvePackageInfo()?.versionName)
        }
        if (!containsKey("buildNumber")) {
          put("buildNumber", resolveVersionCode(resolvePackageInfo()))
        }
      })
      metadata.put("crash", crashPayload)
    }

    if (config.metadata.isNotEmpty()) {
      metadata.put("custom", mapToJson(config.metadata))
    }

    if (metadata.length() > 0) {
      root.put("metadata", metadata)
    }

    return root.toString()
  }

  private fun sessionPayload(): JSONObject {
    val durationMs = System.currentTimeMillis() - sessionStartMs
    return JSONObject().apply {
      put("id", sessionId)
      put("startedAt", isoTimestamp(sessionStartMs))
      put("durationMs", durationMs)
    }
  }

  private fun usagePayload(): JSONObject {
    val now = System.currentTimeMillis()
    val offsetMinutes = (java.util.TimeZone.getDefault().getOffset(now) / 60000)
    return JSONObject().apply {
      put("timestamp", isoTimestamp(now))
      put("timeZone", java.util.TimeZone.getDefault().id)
      put("timeZoneOffsetMinutes", offsetMinutes)
      put("locale", Locale.getDefault().toLanguageTag())
      put("sessionId", sessionId)
      put("sessionDurationMs", now - sessionStartMs)
    }
  }

  private fun distributionPayload(): JSONObject {
    val payload = mutableMapOf<String, Any?>()
    payload.putAll(config.distributionInfo)
    val packageInfo = resolvePackageInfo()
    if (payload["appVersion"] == null) {
      payload["appVersion"] = packageInfo?.versionName
    }
    if (payload["buildNumber"] == null) {
      payload["buildNumber"] = resolveVersionCode(packageInfo)
    }
    return mapToJson(payload)
  }

  private fun devicePayload(): JSONObject {
    val payload = mutableMapOf<String, Any?>()
    payload.putAll(config.deviceInfo)
    if (payload["model"] == null) {
      payload["model"] = Build.MODEL
    }
    if (payload["manufacturer"] == null) {
      payload["manufacturer"] = Build.MANUFACTURER
    }
    if (payload["osVersion"] == null) {
      payload["osVersion"] = Build.VERSION.RELEASE
    }
    if (payload["locale"] == null) {
      payload["locale"] = Locale.getDefault().toLanguageTag()
    }
    val packageInfo = resolvePackageInfo()
    if (payload["appVersion"] == null) {
      payload["appVersion"] = packageInfo?.versionName
    }
    if (payload["buildNumber"] == null) {
      payload["buildNumber"] = resolveVersionCode(packageInfo)
    }
    return mapToJson(payload)
  }

  private fun resolveDeviceId(): String? {
    if (!config.deviceId.isNullOrBlank()) {
      return config.deviceId
    }
    val existing = preferences.getString("device_id", null)
    if (!existing.isNullOrBlank()) {
      return existing
    }
    val created = UUID.randomUUID().toString()
    preferences.edit().putString("device_id", created).apply()
    return created
  }

  private fun pendingCrashes(): List<Map<String, Any?>> {
    val json = preferences.getString(crashKey, null) ?: return emptyList()
    return try {
      val array = JSONArray(json)
      (0 until array.length()).mapNotNull { idx ->
        val obj = array.optJSONObject(idx) ?: return@mapNotNull null
        obj.toMap()
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun resolveTargetId(): String? {
    if (!config.targetId.isNullOrBlank()) {
      return config.targetId
    }
    return appContext.packageName
  }

  private fun resolveLaunchKey(): String {
    if (!config.launchKey.isNullOrBlank()) {
      return config.launchKey
    }
    val packageName = appContext.packageName
    val packageInfo = resolvePackageInfo()
    val versionName = packageInfo?.versionName ?: "0"
    val versionCode = resolveVersionCode(packageInfo) ?: "0"
    return "einstore.launch.$packageName.$versionName.$versionCode"
  }

  private fun resolvePackageInfo(): PackageInfo? {
    return try {
      appContext.packageManager.getPackageInfo(appContext.packageName, 0)
    } catch (_: PackageManager.NameNotFoundException) {
      null
    }
  }

  private fun resolveVersionCode(packageInfo: PackageInfo?): String? {
    packageInfo ?: return null
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      packageInfo.longVersionCode.toString()
    } else {
      @Suppress("DEPRECATION")
      packageInfo.versionCode.toString()
    }
  }

  private fun JSONObject.toMap(): Map<String, Any?> {
    val map = mutableMapOf<String, Any?>()
    val keys = keys()
    while (keys.hasNext()) {
      val key = keys.next()
      map[key] = this.opt(key)
    }
    return map
  }

  private fun mapToJson(map: Map<String, Any?>): JSONObject {
    val json = JSONObject()
    for ((key, value) in map) {
      if (value == null) {
        continue
      }
      when (value) {
        is Map<*, *> -> {
          @Suppress("UNCHECKED_CAST")
          json.put(key, mapToJson(value as Map<String, Any?>))
        }
        is List<*> -> {
          json.put(key, JSONArray(value))
        }
        else -> json.put(key, value)
      }
    }
    return json
  }

  private fun isoTimestamp(value: Long): String {
    val formatter = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    formatter.timeZone = java.util.TimeZone.getTimeZone("UTC")
    return formatter.format(java.util.Date(value))
  }
}
