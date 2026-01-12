import 'dart:convert';
import 'dart:io';
import 'package:package_info_plus/package_info_plus.dart';

class EinstoreTrackingException implements Exception {
  EinstoreTrackingException(this.message);

  final String message;

  @override
  String toString() => "EinstoreTrackingException: $message";
}

enum EinstoreService { analytics, errors, distribution, devices, usage, crashes }

abstract class LaunchStore {
  Future<bool> hasLaunched(String key);
  Future<void> markLaunched(String key);
}

class MemoryLaunchStore implements LaunchStore {
  final Set<String> _keys = <String>{};

  @override
  Future<bool> hasLaunched(String key) async => _keys.contains(key);

  @override
  Future<void> markLaunched(String key) async {
    _keys.add(key);
  }
}

class EinstoreTrackingConfig {
  EinstoreTrackingConfig({
    this.baseUrl,
    this.buildId,
    this.downloadUrl,
    this.launchUrl,
    this.eventUrl,
    Map<String, String>? headers,
    String? platform,
    this.targetId,
    this.deviceId,
    Map<String, Object?>? metadata,
    List<EinstoreService>? services,
    Map<String, Object?>? distributionInfo,
    Map<String, Object?>? deviceInfo,
    Map<String, Object?>? userProperties,
    this.launchKey,
    LaunchStore? launchStore,
    bool? crashEnabled,
  })  : headers = headers ?? <String, String>{},
        baseUrl = baseUrl ?? Uri.parse("https://api.einstore.dev"),
        buildId = buildId,
        platform = platform ?? _defaultPlatform(),
        metadata = metadata ?? <String, Object?>{},
        services = services ?? const [EinstoreService.distribution, EinstoreService.devices],
        distributionInfo = distributionInfo ?? <String, Object?>{},
        deviceInfo = deviceInfo ?? <String, Object?>{},
        userProperties = userProperties ?? <String, Object?>{},
        launchStore = launchStore ?? MemoryLaunchStore(),
        crashEnabled = crashEnabled ?? false;

  final Uri? baseUrl;
  final String? buildId;
  final Uri? downloadUrl;
  final Uri? launchUrl;
  final Uri? eventUrl;
  final Map<String, String> headers;
  final String platform;
  final String? targetId;
  final String? deviceId;
  final Map<String, Object?> metadata;
  final List<EinstoreService> services;
  final Map<String, Object?> distributionInfo;
  final Map<String, Object?> deviceInfo;
  final Map<String, Object?> userProperties;
  final String? launchKey;
  final LaunchStore launchStore;
  final bool crashEnabled;
}

class EinstoreTracker {
  EinstoreTracker(this.config, {HttpClient? httpClient})
      : _client = httpClient ?? HttpClient(),
        _sessionId = _newSessionId(),
        _sessionStart = DateTime.now().toUtc(),
        _userProperties = Map<String, Object?>.from(config.userProperties),
        _packageInfoFuture = PackageInfo.fromPlatform(),
        _crashFile = "${Directory.systemTemp.path}/einstore_crashes.json" {
    if (config.crashEnabled && _hasService(EinstoreService.crashes)) {
      uploadPendingCrashes();
    }
  }

  final EinstoreTrackingConfig config;
  final HttpClient _client;
  String _sessionId;
  DateTime _sessionStart;
  final Map<String, Object?> _userProperties;
  final Future<PackageInfo> _packageInfoFuture;
  PackageInfo? _packageInfo;
  final String _crashFile;

  void startNewSession() {
    _sessionId = _newSessionId();
    _sessionStart = DateTime.now().toUtc();
  }

  void setUserProperties(Map<String, Object?> properties) {
    _userProperties.addAll(properties);
  }

  Future<void> trackDownload() async {
    _ensureServiceEnabled(EinstoreService.distribution);
    await _track(_resolvedDownloadUrl());
  }

  Future<void> trackLaunch() async {
    _ensureServiceEnabled(EinstoreService.analytics);
    startNewSession();
    await _track(_resolvedLaunchUrl(), event: _analyticsEvent("app_launch"));
  }

  Future<void> trackLaunchOnce() async {
    _ensureServiceEnabled(EinstoreService.analytics);
    final key = config.launchKey ?? _defaultLaunchKey(config);
    final alreadyLaunched = await config.launchStore.hasLaunched(key);
    if (alreadyLaunched) {
      return;
    }
    await trackLaunch();
    await config.launchStore.markLaunched(key);
  }

  Future<void> trackScreenView(String screenName,
      {Map<String, Object?> properties = const {}}) async {
    _ensureServiceEnabled(EinstoreService.analytics);
    final payload = Map<String, Object?>.from(properties);
    payload["screen"] = screenName;
    await _track(_eventUrl(), event: _analyticsEvent("screen_view", payload));
  }

  Future<void> trackEvent(String name,
      {Map<String, Object?> properties = const {}}) async {
    _ensureServiceEnabled(EinstoreService.analytics);
    await _track(_eventUrl(), event: _analyticsEvent(name, properties));
  }

  Future<void> trackError(String message,
      {String? stackTrace, Map<String, Object?> properties = const {}}) async {
    _ensureServiceEnabled(EinstoreService.errors);
    await _track(
      _eventUrl(),
      errorInfo: {
        "message": message,
        if (stackTrace != null && stackTrace.isNotEmpty) "stackTrace": stackTrace,
        if (properties.isNotEmpty) "properties": properties,
      },
    );
  }

  void close() {
    _client.close(force: true);
  }

  Future<void> recordCrash(Map<String, Object?> crash) async {
    if (!config.crashEnabled || !_hasService(EinstoreService.crashes)) return;
    final existing = await _loadPendingCrashes();
    existing.add(crash);
    await _savePendingCrashes(existing);
  }

  Future<void> uploadPendingCrashes() async {
    if (!config.crashEnabled || !_hasService(EinstoreService.crashes)) return;
    final crashes = await _loadPendingCrashes();
    if (crashes.isEmpty) return;
    for (final crash in crashes) {
      try {
        await _track(_eventUrl(), crash: crash);
      } catch (_) {
        return;
      }
    }
    await _savePendingCrashes([]);
  }

  Future<void> _track(Uri? url,
      {Map<String, Object?>? event, Map<String, Object?>? errorInfo, Map<String, Object?>? crash}) async {
    final resolved = url ?? _resolvedEventUrl();
    if (resolved == null) {
      throw EinstoreTrackingException("Tracking URL is required");
    }
    final request = await _client.postUrl(resolved);
    request.headers.contentType = ContentType.json;
    config.headers.forEach(request.headers.set);
    final payload = await _buildPayload(event: event, errorInfo: errorInfo, crash: crash);
    request.add(utf8.encode(jsonEncode(payload)));
    final response = await request.close();
    await response.drain();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw EinstoreTrackingException(
        "Tracking failed with status ${response.statusCode}",
      );
    }
  }

  Future<Map<String, Object?>> _buildPayload(
      {Map<String, Object?>? event, Map<String, Object?>? errorInfo, Map<String, Object?>? crash}) async {
    final payload = <String, Object?>{
      "platform": config.platform,
    };
    if (config.deviceId != null && config.deviceId!.isNotEmpty) {
      payload["deviceId"] = config.deviceId;
    }
    final targetId = await _resolveTargetId();
    if (targetId != null && targetId.isNotEmpty) {
      payload["targetId"] = targetId;
    }

    final metadata = <String, Object?>{
      "services": config.services.map((service) => service.name).toList(),
    };

    if (_hasService(EinstoreService.analytics)) {
      final analytics = <String, Object?>{};
      if (event != null) {
        analytics["event"] = event;
      }
      if (_userProperties.isNotEmpty) {
        analytics["userProperties"] = Map<String, Object?>.from(_userProperties);
      }
      analytics["session"] = _sessionPayload();
      if (analytics.isNotEmpty) {
        metadata["analytics"] = analytics;
      }
    }

    if (_hasService(EinstoreService.errors) && errorInfo != null) {
      metadata["errors"] = errorInfo;
    }

    if (_hasService(EinstoreService.crashes) && crash != null) {
      final crashPayload = Map<String, Object?>.from(crash);
      final packageInfo = await _resolvePackageInfo();
      crashPayload.putIfAbsent("platform", () => config.platform);
      if (packageInfo != null) {
        crashPayload.putIfAbsent("appVersion", () => packageInfo.version);
        crashPayload.putIfAbsent("buildNumber", () => packageInfo.buildNumber);
      }
      metadata["crash"] = crashPayload;
    }

    if (_hasService(EinstoreService.distribution)) {
      final distribution = await _distributionPayload();
      if (distribution.isNotEmpty) {
        metadata["distribution"] = distribution;
      }
    }

    if (_hasService(EinstoreService.devices)) {
      final device = await _devicePayload();
      if (device.isNotEmpty) {
        metadata["device"] = device;
      }
    }

    if (_hasService(EinstoreService.usage)) {
      metadata["usage"] = _usagePayload();
    }

    if (config.metadata.isNotEmpty) {
      metadata["custom"] = Map<String, Object?>.from(config.metadata);
    }

    if (metadata.isNotEmpty) {
      payload["metadata"] = metadata;
    }

    return payload;
  }

  Map<String, Object?> _analyticsEvent(String name,
      [Map<String, Object?>? properties]) {
    final payload = <String, Object?>{"name": name};
    if (properties != null && properties.isNotEmpty) {
      payload["properties"] = properties;
    }
    return payload;
  }

  Map<String, Object?> _sessionPayload() {
    final durationMs = DateTime.now().toUtc().difference(_sessionStart).inMilliseconds;
    return {
      "id": _sessionId,
      "startedAt": _sessionStart.toIso8601String(),
      "durationMs": durationMs,
    };
  }

  Map<String, Object?> _usagePayload() {
    final now = DateTime.now();
    final durationMs = now.toUtc().difference(_sessionStart).inMilliseconds;
    return {
      "timestamp": now.toUtc().toIso8601String(),
      "timeZone": now.timeZoneName,
      "timeZoneOffsetMinutes": now.timeZoneOffset.inMinutes,
      "locale": Platform.localeName,
      "sessionId": _sessionId,
      "sessionDurationMs": durationMs,
    };
  }

  Future<Map<String, Object?>> _distributionPayload() async {
    final payload = Map<String, Object?>.from(config.distributionInfo);
    final packageInfo = await _resolvePackageInfo();
    if (packageInfo != null) {
      payload.putIfAbsent("appVersion", () => packageInfo.version);
      payload.putIfAbsent("buildNumber", () => packageInfo.buildNumber);
    }
    return payload;
  }

  Future<Map<String, Object?>> _devicePayload() async {
    final payload = Map<String, Object?>.from(config.deviceInfo);
    payload.putIfAbsent("osVersion", () => Platform.operatingSystemVersion);
    payload.putIfAbsent("locale", () => Platform.localeName);
    payload.putIfAbsent("platform", () => config.platform);
    final packageInfo = await _resolvePackageInfo();
    if (packageInfo != null) {
      payload.putIfAbsent("appVersion", () => packageInfo.version);
      payload.putIfAbsent("buildNumber", () => packageInfo.buildNumber);
    }
    return payload;
  }

  Future<PackageInfo?> _resolvePackageInfo() async {
    if (_packageInfo != null) {
      return _packageInfo;
    }
    try {
      _packageInfo = await _packageInfoFuture;
      return _packageInfo;
    } catch (_) {
      return null;
    }
  }

  Future<String?> _resolveTargetId() async {
    if (config.targetId != null && config.targetId!.isNotEmpty) {
      return config.targetId;
    }
    final info = await _resolvePackageInfo();
    return info?.packageName;
  }

  Future<List<Map<String, Object?>>> _loadPendingCrashes() async {
    final file = File(_crashFile);
    if (!await file.exists()) return [];
    try {
      final text = await file.readAsString();
      if (text.isEmpty) return [];
      final data = jsonDecode(text);
      if (data is List) {
        return data.cast<Map<String, Object?>>();
      }
    } catch (_) {
      return [];
    }
    return [];
  }

  Future<void> _savePendingCrashes(List<Map<String, Object?>> crashes) async {
    final file = File(_crashFile);
    await file.writeAsString(jsonEncode(crashes));
  }

  void _ensureServiceEnabled(EinstoreService service) {
    if (!_hasService(service)) {
      throw EinstoreTrackingException("Service ${service.name} is disabled");
    }
  }

  bool _hasService(EinstoreService service) {
    return config.services.contains(service);
  }

  Uri _eventUrl() {
    final url = config.eventUrl ?? _resolvedEventUrl();
    if (url == null) {
      throw EinstoreTrackingException("eventUrl or launchUrl is required");
    }
    return url;
  }

  Uri? _resolvedDownloadUrl() {
    return _resolveUrl(config.downloadUrl, "builds/{id}/downloads");
  }

  Uri? _resolvedLaunchUrl() {
    return _resolveUrl(config.launchUrl, "builds/{id}/installs");
  }

  Uri? _resolvedEventUrl() {
    return _resolveUrl(config.eventUrl, "builds/{id}/events") ??
        _resolveUrl(config.launchUrl, "builds/{id}/installs");
  }

  Uri? _resolveUrl(Uri? provided, String defaultPath) {
    if (provided != null) {
      return provided;
    }
    if (config.baseUrl == null) {
      return null;
    }
    final base = config.baseUrl!;
    final path = config.buildId != null
        ? defaultPath.replaceAll("{id}", config.buildId!)
        : "tracking/events";
    final joined =
        base.toString().endsWith("/") ? "${base.toString()}$path" : "${base.toString()}/$path";
    return Uri.parse(joined);
  }
}

String _defaultPlatform() {
  if (Platform.isAndroid) {
    return "android";
  }
  if (Platform.isIOS) {
    return "ios";
  }
  return Platform.operatingSystem;
}

String _defaultLaunchKey(EinstoreTrackingConfig config) {
  if (config.deviceId != null && config.deviceId!.isNotEmpty) {
    return "einstore.launch.${config.deviceId}";
  }
  return "einstore.launch.${config.platform}";
}

String _newSessionId() => DateTime.now().microsecondsSinceEpoch.toString();
