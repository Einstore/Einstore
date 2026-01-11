import Foundation

public enum EinstoreTrackingError: Error {
  case invalidPayload
  case invalidResponse
  case requestFailed(statusCode: Int)
  case missingUrl
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
  public let downloadUrl: URL?
  public let launchUrl: URL?
  public let headers: [String: String]
  public let platform: String
  public let targetId: String?
  public let deviceId: String?
  public let metadata: [String: Any]?
  public let launchKey: String?

  public init(
    downloadUrl: URL? = nil,
    launchUrl: URL? = nil,
    headers: [String: String] = [:],
    platform: String = "ios",
    targetId: String? = nil,
    deviceId: String? = nil,
    metadata: [String: Any]? = nil,
    launchKey: String? = nil
  ) {
    self.downloadUrl = downloadUrl
    self.launchUrl = launchUrl
    self.headers = headers
    self.platform = platform
    self.targetId = targetId
    self.deviceId = deviceId
    self.metadata = metadata
    self.launchKey = launchKey
  }
}

public final class EinstoreTracker {
  private let config: EinstoreTrackingConfig
  private let session: URLSession
  private let deviceIdProvider: EinstoreDeviceIdProvider
  private let launchStorage: EinstoreLaunchStorage

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
  }

  public func trackDownload(completion: ((Result<Void, Error>) -> Void)? = nil) {
    track(url: config.downloadUrl, completion: completion)
  }

  public func trackLaunch(completion: ((Result<Void, Error>) -> Void)? = nil) {
    track(url: config.launchUrl, completion: completion)
  }

  public func trackLaunchOnce(completion: ((Result<Void, Error>) -> Void)? = nil) {
    let key = resolveLaunchKey()
    if launchStorage.hasLaunched(key: key) {
      completion?(.success(()))
      return
    }

    track(url: config.launchUrl) { [launchStorage] result in
      if case .success = result {
        launchStorage.markLaunched(key: key)
      }
      completion?(result)
    }
  }

  private func resolveLaunchKey() -> String {
    if let launchKey = config.launchKey, !launchKey.isEmpty {
      return launchKey
    }
    let bundleId = Bundle.main.bundleIdentifier ?? "unknown"
    let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
    return "einstore.launch.\(bundleId).\(buildNumber)"
  }

  private func resolveDeviceId() -> String? {
    if let deviceId = config.deviceId, !deviceId.isEmpty {
      return deviceId
    }
    return deviceIdProvider.deviceId()
  }

  private func track(url: URL?, completion: ((Result<Void, Error>) -> Void)?) {
    guard let url else {
      completion?(.failure(EinstoreTrackingError.missingUrl))
      return
    }
    do {
      let payload = try buildPayload()
      send(url: url, payload: payload, completion: completion)
    } catch {
      completion?(.failure(error))
    }
  }

  private func buildPayload() throws -> [String: Any] {
    var payload: [String: Any] = ["platform": config.platform]
    if let deviceId = resolveDeviceId() {
      payload["deviceId"] = deviceId
    }
    if let targetId = config.targetId {
      payload["targetId"] = targetId
    }
    if let metadata = config.metadata {
      payload["metadata"] = metadata
    }
    guard JSONSerialization.isValidJSONObject(payload) else {
      throw EinstoreTrackingError.invalidPayload
    }
    return payload
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
