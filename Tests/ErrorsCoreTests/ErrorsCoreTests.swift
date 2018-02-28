import XCTest
import ErrorsCore
import Dispatch


final class ErrorsCoreTests : XCTestCase {
    
    func testNothing() throws {
        XCTAssert(true)
    }
    
    static let allTests = [
        ("testNothing", testNothing),
        ]
    
}
