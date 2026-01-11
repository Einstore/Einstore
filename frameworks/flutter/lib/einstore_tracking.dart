import 'dart:convert';
import 'dart:io';

class EinstoreTrackingException implements Exception {
  EinstoreTrackingException(this.message);

  final String message;

  @override
  String toString() => "EinstoreTrackingException: $message";
}

enum EinstoreService { analytics, errors, distribution, devices, usage }

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
  })  : headers = headers ?? <String, String>{},
        platform = platform ?? _defaultPlatform(),
        metadata = metadata ?? <String, Object?>{},
        services = services ?? EinstoreService.values,
        distributionInfo = distributionInfo ?? <String, Object?>{},
        deviceInfo = deviceInfo ?? <String, Object?>{},
        userProperties = userProperties ?? <String, Object?>{},
        launchStore = launchStore ?? MemoryLaunchStore();

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
}

class EinstoreTracker {
  EinstoreTracker(this.config, {HttpClient? httpClient})
      : _client = httpClient ?? HttpClient(),
        _sessionId = _newSessionId(),
        _sessionStart = DateTime.now().toUtc(),
        _userProperties = Map<String, Object?>.from(config.userProperties);

  final EinstoreTrackingConfig config;
  final HttpClient _client;
  String _sessionId;
  DateTime _sessionStart;
  final Map<String, Object?> _userProperties;

  void startNewSession() {
    _sessionId = _newSessionId();
    _sessionStart = DateTime.now().toUtc();
  }

  void setUserProperties(Map<String, Object?> properties) {
    _userProperties.addAll(properties);
  }

  Future<void> trackDownload() async {
    _ensureServiceEnabled(EinstoreService.distribution);
    await _track(config.downloadUrl);
  }

  Future<void> trackLaunch() async {
    _ensureServiceEnabled(EinstoreService.analytics);
    startNewSession();
    await _track(config.launchUrl, event: _analyticsEvent("app_launch"));
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

  Future<void> _track(Uri? url,
      {Map<String, Object?>? event, Map<String, Object?>? errorInfo}) async {
    if (url == null) {
      throw EinstoreTrackingException("Tracking URL is required");
    }
    final request = await _client.postUrl(url);
    request.headers.contentType = ContentType.json;
    config.headers.forEach(request.headers.set);
    final payload = _buildPayload(event: event, errorInfo: errorInfo);
    request.add(utf8.encode(jsonEncode(payload)));
    final response = await request.close();
    await response.drain();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw EinstoreTrackingException(
        "Tracking failed with status ${response.statusCode}",
      );
    }
  }

  Map<String, Object?> _buildPayload(
      {Map<String, Object?>? event, Map<String, Object?>? errorInfo}) {
    final payload = <String, Object?>{
      "platform": config.platform,
    };
    if (config.deviceId != null && config.deviceId!.isNotEmpty) {
      payload["deviceId"] = config.deviceId;
    }
    if (config.targetId != null && config.targetId!.isNotEmpty) {
      payload["targetId"] = config.targetId;
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

    if (_hasService(EinstoreService.distribution)) {
      final distribution = _distributionPayload();
      if (distribution.isNotEmpty) {
        metadata["distribution"] = distribution;
      }
    }

    if (_hasService(EinstoreService.devices)) {
      final device = _devicePayload();
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

  Map<String, Object?> _distributionPayload() {
    final payload = Map<String, Object?>.from(config.distributionInfo);
    return payload;
  }

  Map<String, Object?> _devicePayload() {
    final payload = Map<String, Object?>.from(config.deviceInfo);
    payload.putIfAbsent("osVersion", () => Platform.operatingSystemVersion);
    payload.putIfAbsent("locale", () => Platform.localeName);
    payload.putIfAbsent("platform", () => config.platform);
    return payload;
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
    final url = config.eventUrl ?? config.launchUrl;
    if (url == null) {
      throw EinstoreTrackingException("eventUrl or launchUrl is required");
    }
    return url;
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
