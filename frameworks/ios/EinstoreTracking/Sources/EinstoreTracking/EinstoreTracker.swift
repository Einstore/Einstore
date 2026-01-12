import Foundation
#if canImport(UIKit)
import UIKit
#endif

public enum EinstoreTrackingError: Error {
  case invalidPayload
  case invalidResponse
  case requestFailed(statusCode: Int)
  case missingUrl
  case serviceDisabled(String)
}

public enum EinstoreService: String, CaseIterable {
  case analytics
  case errors
  case distribution
  case devices
  case usage
  case crashes
}

public protocol EinstoreLaunchStorage {
  func hasLaunched(key: String) -> Bool
  func markLaunched(key: String)
}

public final class UserDefaultsLaunchStorage: EinstoreLaunchStorage {
  private let defaults: UserDefaults

  public init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  public func hasLaunched(key: String) -> Bool {
    defaults.bool(forKey: key)
  }

  public func markLaunched(key: String) {
    defaults.set(true, forKey: key)
  }
}

public protocol EinstoreDeviceIdProvider {
  func deviceId() -> String
}

public final class UserDefaultsDeviceIdProvider: EinstoreDeviceIdProvider {
  private let key = "einstore.device-id"
  private let defaults: UserDefaults

  public init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  public func deviceId() -> String {
    if let existing = defaults.string(forKey: key), !existing.isEmpty {
      return existing
    }
    let created = UUID().uuidString
    defaults.set(created, forKey: key)
    return created
  }
}

public struct EinstoreTrackingConfig {
  public let baseUrl: URL?
  public let buildId: String?
  public let downloadUrl: URL?
  public let launchUrl: URL?
  public let eventUrl: URL?
  public let headers: [String: String]
  public let platform: String
  public let targetId: String?
  public let deviceId: String?
  public let metadata: [String: Any]?
  public let launchKey: String?
  public let services: [EinstoreService]
  public let distributionInfo: [String: Any]
  public let deviceInfo: [String: Any]
  public let crashEnabled: Bool

  public init(
    baseUrl: URL? = URL(string: "https://api.einstore.dev"),
    buildId: String? = nil,
    downloadUrl: URL? = nil,
    launchUrl: URL? = nil,
    eventUrl: URL? = nil,
    headers: [String: String] = [:],
    platform: String = "ios",
    targetId: String? = nil,
    deviceId: String? = nil,
    metadata: [String: Any]? = nil,
    launchKey: String? = nil,
    services: [EinstoreService] = [.distribution, .devices],
    distributionInfo: [String: Any] = [:],
    deviceInfo: [String: Any] = [:],
    crashEnabled: Bool = false
  ) {
    self.baseUrl = baseUrl
    self.buildId = buildId
    self.downloadUrl = downloadUrl
    self.launchUrl = launchUrl
    self.eventUrl = eventUrl
    self.headers = headers
    self.platform = platform
    self.targetId = targetId
    self.deviceId = deviceId
    self.metadata = metadata
    self.launchKey = launchKey
    self.services = services
    self.distributionInfo = distributionInfo
    self.deviceInfo = deviceInfo
    self.crashEnabled = crashEnabled
  }
}

public final class EinstoreTracker {
  private struct AnalyticsEvent {
    let name: String
    let properties: [String: Any]
  }

  private struct ErrorInfo {
    let message: String
    let stackTrace: String?
    let properties: [String: Any]
  }

  private let config: EinstoreTrackingConfig
  private let session: URLSession
  private let deviceIdProvider: EinstoreDeviceIdProvider
  private let launchStorage: EinstoreLaunchStorage
  private let crashStorageKey = "einstore.crashes"
  private var sessionId: String
  private var sessionStart: Date
  private var userProperties: [String: Any]

  public init(
    config: EinstoreTrackingConfig,
    session: URLSession = .shared,
    deviceIdProvider: EinstoreDeviceIdProvider = UserDefaultsDeviceIdProvider(),
    launchStorage: EinstoreLaunchStorage = UserDefaultsLaunchStorage()
  ) {
    self.config = config
    self.session = session
    self.deviceIdProvider = deviceIdProvider
    self.launchStorage = launchStorage
    self.sessionId = UUID().uuidString
    self.sessionStart = Date()
    self.userProperties = [:]
    if config.crashEnabled && isServiceEnabled(.crashes) {
      uploadPendingCrashes()
    }
  }

  public func startNewSession() {
    sessionId = UUID().uuidString
    sessionStart = Date()
  }

  public func setUserProperties(_ properties: [String: Any]) {
    for (key, value) in properties {
      userProperties[key] = value
    }
  }

  public func trackDownload(completion: ((Result<Void, Error>) -> Void)? = nil) {
    track(url: resolvedDownloadUrl, requiredService: .distribution, completion: completion)
  }

  public func trackLaunch(completion: ((Result<Void, Error>) -> Void)? = nil) {
    startNewSession()
    track(
      url: resolvedLaunchUrl,
      event: AnalyticsEvent(name: "app_launch", properties: [:]),
      requiredService: .analytics,
      completion: completion
    )
  }

  public func recordCrash(_ crash: [String: Any]) {
    guard config.crashEnabled, isServiceEnabled(.crashes) else { return }
    var existing = pendingCrashes()
    existing.append(crash)
    UserDefaults.standard.set(existing, forKey: crashStorageKey)
  }

  public func uploadPendingCrashes(completion: ((Result<Void, Error>) -> Void)? = nil) {
    guard config.crashEnabled, isServiceEnabled(.crashes) else {
      completion?(.success(()))
      return
    }
    let crashes = pendingCrashes()
    guard !crashes.isEmpty else {
      completion?(.success(()))
      return
    }
    let group = DispatchGroup()
    var firstError: Error?
    for crash in crashes {
      group.enter()
      trackCrash(crash: crash) { result in
        if case .failure(let error) = result, firstError == nil {
          firstError = error
        }
        group.leave()
      }
    }
    group.notify(queue: .main) {
      if firstError == nil {
        UserDefaults.standard.removeObject(forKey: self.crashStorageKey)
        completion?(.success(()))
      } else if let error = firstError {
        completion?(.failure(error))
      }
    }
  }

  public func trackLaunchOnce(completion: ((Result<Void, Error>) -> Void)? = nil) {
    let key = resolveLaunchKey()
    if launchStorage.hasLaunched(key: key) {
      completion?(.success(()))
      return
    }

    trackLaunch { [launchStorage] result in
      if case .success = result {
        launchStorage.markLaunched(key: key)
      }
      completion?(result)
    }
  }

  public func trackScreenView(
    screenName: String,
    properties: [String: Any] = [:],
    completion: ((Result<Void, Error>) -> Void)? = nil
  ) {
    var payload = properties
    payload["screen"] = screenName
    track(
      url: resolvedEventUrl ?? resolvedLaunchUrl,
      event: AnalyticsEvent(name: "screen_view", properties: payload),
      requiredService: .analytics,
      completion: completion
    )
  }

  public func trackEvent(
    name: String,
    properties: [String: Any] = [:],
    completion: ((Result<Void, Error>) -> Void)? = nil
  ) {
    track(
      url: resolvedEventUrl ?? resolvedLaunchUrl,
      event: AnalyticsEvent(name: name, properties: properties),
      requiredService: .analytics,
      completion: completion
    )
  }

  public func trackError(
    message: String,
    stackTrace: String? = nil,
    properties: [String: Any] = [:],
    completion: ((Result<Void, Error>) -> Void)? = nil
  ) {
    track(
      url: resolvedEventUrl ?? resolvedLaunchUrl,
      errorInfo: ErrorInfo(message: message, stackTrace: stackTrace, properties: properties),
      requiredService: .errors,
      completion: completion
    )
  }

  private func resolveLaunchKey() -> String {
    if let launchKey = config.launchKey, !launchKey.isEmpty {
      return launchKey
    }
    let bundleId = Bundle.main.bundleIdentifier ?? "unknown"
    let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
    return "einstore.launch.\(bundleId).\(buildNumber)"
  }

  private func resolveUrl(_ provided: URL?, defaultPath: String) -> URL? {
    if let provided {
      return provided
    }
    guard let base = config.baseUrl else {
      return nil
    }
    if let buildId = config.buildId {
      return base.appendingPathComponent(defaultPath.replacingOccurrences(of: "{id}", with: buildId))
    }
    return base.appendingPathComponent("tracking/events")
  }

  private var resolvedDownloadUrl: URL? {
    resolveUrl(config.downloadUrl, defaultPath: "builds/{id}/downloads")
  }

  private var resolvedLaunchUrl: URL? {
    resolveUrl(config.launchUrl, defaultPath: "builds/{id}/installs")
  }

  private var resolvedEventUrl: URL? {
    resolveUrl(config.eventUrl, defaultPath: "builds/{id}/events")
  }

  private func resolveDeviceId() -> String? {
    if let deviceId = config.deviceId, !deviceId.isEmpty {
      return deviceId
    }
    return deviceIdProvider.deviceId()
  }

  private func resolveTargetId() -> String? {
    if let targetId = config.targetId, !targetId.isEmpty {
      return targetId
    }
    return Bundle.main.bundleIdentifier
  }

  private func pendingCrashes() -> [[String: Any]] {
    (UserDefaults.standard.array(forKey: crashStorageKey) as? [[String: Any]]) ?? []
  }

  private func trackCrash(
    crash: [String: Any],
    completion: ((Result<Void, Error>) -> Void)?
  ) {
    track(
      url: resolvedEventUrl ?? resolvedLaunchUrl,
      crash: crash,
      requiredService: .crashes,
      completion: completion
    )
  }

  private func track(
    url: URL?,
    event: AnalyticsEvent? = nil,
    errorInfo: ErrorInfo? = nil,
    crash: [String: Any]? = nil,
    requiredService: EinstoreService? = nil,
    completion: ((Result<Void, Error>) -> Void)?
  ) {
    guard let url else {
      completion?(.failure(EinstoreTrackingError.missingUrl))
      return
    }
    if let requiredService, !isServiceEnabled(requiredService) {
      completion?(.failure(EinstoreTrackingError.serviceDisabled(requiredService.rawValue)))
      return
    }
    do {
      let payload = try buildPayload(event: event, errorInfo: errorInfo, crash: crash)
      send(url: url, payload: payload, completion: completion)
    } catch {
      completion?(.failure(error))
    }
  }

  private func buildPayload(event: AnalyticsEvent?, errorInfo: ErrorInfo?, crash: [String: Any]?) throws -> [String: Any] {
    var payload: [String: Any] = ["platform": config.platform]
    if let deviceId = resolveDeviceId() {
      payload["deviceId"] = deviceId
    }
    if let targetId = resolveTargetId() {
      payload["targetId"] = targetId
    }

    var metadata: [String: Any] = [:]
    metadata["services"] = config.services.map { $0.rawValue }

    if isServiceEnabled(.analytics) {
      var analytics: [String: Any] = [:]
      if let event {
        analytics["event"] = ["name": event.name, "properties": event.properties]
      }
      if !userProperties.isEmpty {
        analytics["userProperties"] = userProperties
      }
      let session = sessionPayload()
      if !session.isEmpty {
        analytics["session"] = session
      }
      if !analytics.isEmpty {
        metadata["analytics"] = analytics
      }
    }

    if isServiceEnabled(.errors), let errorInfo {
      var errorPayload: [String: Any] = ["message": errorInfo.message]
      if let stackTrace = errorInfo.stackTrace {
        errorPayload["stackTrace"] = stackTrace
      }
      if !errorInfo.properties.isEmpty {
        errorPayload["properties"] = errorInfo.properties
      }
      metadata["errors"] = errorPayload
    }

    if isServiceEnabled(.distribution) {
      let distribution = distributionPayload()
      if !distribution.isEmpty {
        metadata["distribution"] = distribution
      }
    }

    if isServiceEnabled(.devices) {
      let deviceInfo = devicePayload()
      if !deviceInfo.isEmpty {
        metadata["device"] = deviceInfo
      }
    }

    if isServiceEnabled(.usage) {
      metadata["usage"] = usagePayload()
    }

    if isServiceEnabled(.crashes), let crash = crash {
      var crashPayload = crash
      if crashPayload["appVersion"] == nil, let version = appVersion() {
        crashPayload["appVersion"] = version
      }
      if crashPayload["buildNumber"] == nil, let build = buildNumber() {
        crashPayload["buildNumber"] = build
      }
      if crashPayload["platform"] == nil {
        crashPayload["platform"] = config.platform
      }
      metadata["crash"] = crashPayload
    }

    if let custom = config.metadata, !custom.isEmpty {
      metadata["custom"] = custom
    }

    if !metadata.isEmpty {
      payload["metadata"] = metadata
    }

    guard JSONSerialization.isValidJSONObject(payload) else {
      throw EinstoreTrackingError.invalidPayload
    }
    return payload
  }

  private func sessionPayload() -> [String: Any] {
    let durationMs = Int(Date().timeIntervalSince(sessionStart) * 1000)
    return [
      "id": sessionId,
      "startedAt": isoString(from: sessionStart),
      "durationMs": durationMs,
    ]
  }

  private func usagePayload() -> [String: Any] {
    let now = Date()
    let offsetMinutes = TimeZone.current.secondsFromGMT(for: now) / 60
    return [
      "timestamp": isoString(from: now),
      "timeZone": TimeZone.current.identifier,
      "timeZoneOffsetMinutes": offsetMinutes,
      "locale": Locale.current.identifier,
      "sessionId": sessionId,
      "sessionDurationMs": Int(now.timeIntervalSince(sessionStart) * 1000),
    ]
  }

  private func distributionPayload() -> [String: Any] {
    var payload = config.distributionInfo
    mergeIfMissing(key: "appVersion", into: &payload, value: appVersion())
    mergeIfMissing(key: "buildNumber", into: &payload, value: buildNumber())
    return payload
  }

  private func devicePayload() -> [String: Any] {
    var payload = config.deviceInfo
    #if canImport(UIKit)
    mergeIfMissing(key: "model", into: &payload, value: UIDevice.current.model)
    mergeIfMissing(key: "manufacturer", into: &payload, value: "Apple")
    mergeIfMissing(key: "osVersion", into: &payload, value: UIDevice.current.systemVersion)
    #endif
    mergeIfMissing(key: "locale", into: &payload, value: Locale.current.identifier)
    mergeIfMissing(key: "appVersion", into: &payload, value: appVersion())
    mergeIfMissing(key: "buildNumber", into: &payload, value: buildNumber())
    return payload
  }

  private func appVersion() -> String? {
    Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
  }

  private func buildNumber() -> String? {
    Bundle.main.infoDictionary?["CFBundleVersion"] as? String
  }

  private func mergeIfMissing(key: String, into payload: inout [String: Any], value: String?) {
    guard payload[key] == nil, let value else {
      return
    }
    payload[key] = value
  }

  private func isServiceEnabled(_ service: EinstoreService) -> Bool {
    config.services.contains(service)
  }

  private func isoString(from date: Date) -> String {
    ISO8601DateFormatter().string(from: date)
  }

  private func send(
    url: URL,
    payload: [String: Any],
    completion: ((Result<Void, Error>) -> Void)?
  ) {
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    for (key, value) in config.headers {
      request.setValue(value, forHTTPHeaderField: key)
    }

    do {
      request.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])
    } catch {
      completion?(.failure(error))
      return
    }

    session.dataTask(with: request) { _, response, error in
      if let error {
        completion?(.failure(error))
        return
      }
      guard let http = response as? HTTPURLResponse else {
        completion?(.failure(EinstoreTrackingError.invalidResponse))
        return
      }
      guard (200...299).contains(http.statusCode) else {
        completion?(.failure(EinstoreTrackingError.requestFailed(statusCode: http.statusCode)))
        return
      }
      completion?(.success(()))
    }.resume()
  }
}
