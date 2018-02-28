import XCTest
import ApiCore
import Dispatch
import VaporTestTools


final class ApiCoreTests : XCTestCase {
    
    static let allTests: [(String, Any)] = [
        ("testNothing", testNothing),
        ("testLinuxTestSuiteIncludesAllTests", testLinuxTestSuiteIncludesAllTests)
    ]
    
    // MARK: Setup
    
    
    // MARK: Tests
    
    func testNothing() {
        XCTAssert(true)
    }
    
    func testLinuxTestSuiteIncludesAllTests() {
        #if os(macOS) || os(iOS) || os(tvOS) || os(watchOS)
        let thisClass = type(of: self)
        let linuxCount = thisClass.allTests.count
        let darwinCount = Int(thisClass.defaultTestSuite.testCaseCount)
        XCTAssertEqual(linuxCount, darwinCount,
                       "\(darwinCount - linuxCount) tests are missing from allTests")
        #endif
    }
    
}
