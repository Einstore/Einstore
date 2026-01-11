import 'dart:convert';
import 'dart:io';

class EinstoreTrackingException implements Exception {
  EinstoreTrackingException(this.message);

  final String message;

  @override
  String toString() => "EinstoreTrackingException: $message";
}

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
    Map<String, String>? headers,
    String? platform,
    this.targetId,
    this.deviceId,
    Map<String, Object?>? metadata,
    this.launchKey,
    LaunchStore? launchStore,
  })  : headers = headers ?? <String, String>{},
        platform = platform ?? _defaultPlatform(),
        metadata = metadata ?? <String, Object?>{},
        launchStore = launchStore ?? MemoryLaunchStore();

  final Uri? downloadUrl;
  final Uri? launchUrl;
  final Map<String, String> headers;
  final String platform;
  final String? targetId;
  final String? deviceId;
  final Map<String, Object?> metadata;
  final String? launchKey;
  final LaunchStore launchStore;
}

class EinstoreTracker {
  EinstoreTracker(this.config, {HttpClient? httpClient})
      : _client = httpClient ?? HttpClient();

  final EinstoreTrackingConfig config;
  final HttpClient _client;

  Future<void> trackDownload() => _track(config.downloadUrl);

  Future<void> trackLaunch() => _track(config.launchUrl);

  Future<void> trackLaunchOnce() async {
    final url = config.launchUrl;
    if (url == null) {
      throw EinstoreTrackingException("launchUrl is required");
    }
    final key = config.launchKey ?? _defaultLaunchKey(config);
    final alreadyLaunched = await config.launchStore.hasLaunched(key);
    if (alreadyLaunched) {
      return;
    }
    await _track(url);
    await config.launchStore.markLaunched(key);
  }

  void close() {
    _client.close(force: true);
  }

  Future<void> _track(Uri? url) async {
    if (url == null) {
      throw EinstoreTrackingException("Tracking URL is required");
    }
    final request = await _client.postUrl(url);
    request.headers.contentType = ContentType.json;
    config.headers.forEach(request.headers.set);
    final payload = _buildPayload(config);
    request.add(utf8.encode(jsonEncode(payload)));
    final response = await request.close();
    await response.drain();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw EinstoreTrackingException(
        "Tracking failed with status ${response.statusCode}",
      );
    }
  }
}

Map<String, Object?> _buildPayload(EinstoreTrackingConfig config) {
  final payload = <String, Object?>{
    "platform": config.platform,
  };
  if (config.deviceId != null && config.deviceId!.isNotEmpty) {
    payload["deviceId"] = config.deviceId;
  }
  if (config.targetId != null && config.targetId!.isNotEmpty) {
    payload["targetId"] = config.targetId;
  }
  if (config.metadata.isNotEmpty) {
    payload["metadata"] = config.metadata;
  }
  return payload;
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
