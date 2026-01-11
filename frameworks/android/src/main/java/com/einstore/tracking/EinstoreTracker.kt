package com.einstore.tracking

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.concurrent.Executor
import java.util.concurrent.Executors

data class EinstoreTrackingConfig(
  val downloadUrl: String? = null,
  val launchUrl: String? = null,
  val headers: Map<String, String> = emptyMap(),
  val platform: String = "android",
  val targetId: String? = null,
  val deviceId: String? = null,
  val metadata: Map<String, Any?> = emptyMap(),
  val launchKey: String? = null
)

class EinstoreTracker(
  context: Context,
  private val config: EinstoreTrackingConfig,
  private val executor: Executor = Executors.newSingleThreadExecutor()
) {
  private val appContext = context.applicationContext
  private val preferences = appContext.getSharedPreferences("einstore_tracking", Context.MODE_PRIVATE)

  fun trackDownload(callback: ((Result<Unit>) -> Unit)? = null) {
    trackAsync(config.downloadUrl, callback)
  }

  fun trackLaunch(callback: ((Result<Unit>) -> Unit)? = null) {
    trackAsync(config.launchUrl, callback)
  }

  fun trackLaunchOnce(callback: ((Result<Unit>) -> Unit)? = null) {
    val key = resolveLaunchKey()
    if (preferences.getBoolean(key, false)) {
      callback?.invoke(Result.success(Unit))
      return
    }
    trackAsync(config.launchUrl) { result ->
      if (result.isSuccess) {
        preferences.edit().putBoolean(key, true).apply()
      }
      callback?.invoke(result)
    }
  }

  private fun trackAsync(url: String?, callback: ((Result<Unit>) -> Unit)?) {
    if (url.isNullOrBlank()) {
      callback?.invoke(Result.failure(IllegalStateException("Tracking URL is required")))
      return
    }
    executor.execute {
      callback?.invoke(post(url))
    }
  }

  private fun post(url: String): Result<Unit> {
    return try {
      val payload = buildPayload()
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

  private fun buildPayload(): String {
    val payload = JSONObject()
    payload.put("platform", config.platform)
    resolveDeviceId()?.let { payload.put("deviceId", it) }
    config.targetId?.let { payload.put("targetId", it) }
    if (config.metadata.isNotEmpty()) {
      payload.put("metadata", JSONObject(config.metadata))
    }
    return payload.toString()
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

  private fun resolveLaunchKey(): String {
    if (!config.launchKey.isNullOrBlank()) {
      return config.launchKey
    }
    val packageName = appContext.packageName
    val packageInfo = try {
      appContext.packageManager.getPackageInfo(packageName, 0)
    } catch (_: PackageManager.NameNotFoundException) {
      null
    }
    val versionName = packageInfo?.versionName ?: "0"
    val versionCode = if (packageInfo == null) {
      "0"
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      packageInfo.longVersionCode.toString()
    } else {
      @Suppress("DEPRECATION")
      packageInfo.versionCode.toString()
    }
    return "einstore.launch.$packageName.$versionName.$versionCode"
  }
}
