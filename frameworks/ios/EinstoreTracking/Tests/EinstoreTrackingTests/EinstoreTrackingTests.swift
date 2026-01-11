import XCTest
@testable import EinstoreTracking

final class EinstoreTrackingTests: XCTestCase {
  func testDeviceIdProviderPersistsValue() {
    let suiteName = "einstore.tests.device-id.\(UUID().uuidString)"
    guard let defaults = UserDefaults(suiteName: suiteName) else {
      XCTFail("Failed to create UserDefaults suite")
      return
    }
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let provider = UserDefaultsDeviceIdProvider(defaults: defaults)
    let first = provider.deviceId()
    let second = provider.deviceId()

    XCTAssertEqual(first, second)
  }

  func testLaunchStorageMarksLaunch() {
    let suiteName = "einstore.tests.launch-storage.\(UUID().uuidString)"
    guard let defaults = UserDefaults(suiteName: suiteName) else {
      XCTFail("Failed to create UserDefaults suite")
      return
    }
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let storage = UserDefaultsLaunchStorage(defaults: defaults)
    let key = "einstore.launch.key"

    XCTAssertFalse(storage.hasLaunched(key: key))
    storage.markLaunched(key: key)
    XCTAssertTrue(storage.hasLaunched(key: key))
  }
}
