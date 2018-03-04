//
//  UploadKeyTests.swift
//  BoostCoreTests
//
//  Created by Ondrej Rafaj on 04/03/2018.
//

import XCTest
import Vapor
import VaporTestTools
import FluentTestTools
import ApiCoreTestTools
import BoostTestTools
@testable import ApiCore


class UploadKeyControllerTests: XCTestCase, UsersTestCase, LinuxTests {
    
    var app: Application!
    
    var user1: User!
    var user2: User!
    
    // MARK: Linux
    
    static let allTests: [(String, Any)] = [
        ("testValidGetAuthRequest", testValidGetAuthRequest),
        ("testLinuxTests", testLinuxTests)
    ]
    
    func testLinuxTests() {
        doTestLinuxTestsAreOk()
    }
    
    // MARK: Setup
    
    override func setUp() {
        super.setUp()
        
        app = Application.testable.newBoostTestApp()
        
        app.testable.delete(allFor: Token.self)
        
        setupUsers()
    }
    
    // MARK: Login tests
    
    func testValidGetAuthRequest() {
//        let req = HTTPRequest.testable.get(uri: "/auth", headers: [
//            "Authorization": "Basic YWRtaW5AbGl2ZXVpLmlvOmFkbWlu"
//            ])
//        do {
//            let res = try app.testable.response(throwingTo: req)
//            
//            checkAuthResult(res)
//        } catch {
//            print(error)
//            XCTFail()
//        }
    }
    
}


