import XCTest
import ApiCore
import Dispatch
import VaporTestTools
import ApiCoreTestTools


final class ApiCoreTests : XCTestCase, LinuxTests {
    
    // MARK: Linux
    
    static let allTests: [(String, Any)] = [
        ("testLinuxTests", testLinuxTests)
    ]
    
    func testLinuxTests() {
        doTestLinuxTestsAreOk()
    }
    
}
