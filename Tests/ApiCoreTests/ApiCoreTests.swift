//
//  ApiCoreTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 05/03/2018.
//

import Foundation
import XCTest
import Vapor
import VaporTestTools
import ApiCoreTestTools
import ErrorsCore
@testable import ApiCore



final class ApiCoreTests : XCTestCase, UsersTestCase, LinuxTests {
    
    var app: Application!
    
    var user1: User!
    var user2: User!
    
    
    // MARK: Setup
    
    override func setUp() {
        super.setUp()
        
        app = Application.testable.newApiCoreTestApp()
        
        setupUsers()
    }
    
    // MARK: Linux
    
    static let allTests: [(String, Any)] = [
        ("testRequestHoldsSessionID", testRequestHoldsSessionID),
        ("testLinuxTests", testLinuxTests)
    ]
    
    func testLinuxTests() {
        doTestLinuxTestsAreOk()
    }
    
    // MARK: Tests
    
    func testRequestHoldsSessionID() {
        let req = HTTPRequest.testable.get(uri: "/ping", authorizedUser: user1, on: app)
        
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let uuid = r.request.sessionId
        XCTAssertEqual(uuid, r.request.sessionId, "Session ID needs to be the same")
    }

}
