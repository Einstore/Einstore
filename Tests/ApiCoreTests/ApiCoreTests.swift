import App
import Dispatch
import XCTest
import VaporTestTools


final class ApiCoreTests : XCTestCase {
    
    static let allTests = [
        ("testNothing", testNothing),
        ("testLinuxTestSuiteIncludesAllTests", testLinuxTestSuiteIncludesAllTests),
        ]
    
    // MARK: Setup
    
    
    // MARK: Tests
    
    func testNothing() throws {
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
