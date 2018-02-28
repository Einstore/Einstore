//
//  AuthControllerTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 28/02/2018.
//

import XCTest
import Vapor
import VaporTestTools
import ApiCoreTestTools
import ApiCore


class AuthControllerTests: XCTestCase, UsersTestCase {
    
    var app: Application!
    
    var user1: User!
    var user2: User!
    
    // MARK: Setup
    
    override func setUp() {
        super.setUp()
        
        app = Application.testable.newApiCoreTestApp()
        
        setupUsers()
    }
    
    // MARK: Tests
    
    func testValidGetAuthRequest() {
        let req = HTTPRequest.testable.get(uri: "/auth", headers: [
            "Authorization": "Basic YWRtaW5AbGl2ZXVpLmlvOmFkbWlu"
            ])
        do {
            let res = try app.testable.response(throwingTo: req)
            
            res.testable.debug()
            
            let data = res.testable.content(as: Token.self)
            // TODO: Refactor tests so they reuse following code (for post and get methods)
            XCTAssertNotNil(data, "Token can't be nil")
            if let data = data {
                XCTAssertNotNil(data.id, "Token id can't be nil")
                XCTAssertFalse(data.token.isEmpty, "Token data should be present")
                XCTAssertTrue(data.expires.timeIntervalSince1970 > 0, "Token data should be present")
                XCTAssertFalse(data.userId.uuidString.isEmpty, "Token data should be present")
            }
            
            XCTAssertTrue(res.testable.has(statusCode: .ok), "Wrong status code")
            XCTAssertTrue(res.testable.has(contentType: "application/json; charset=utf-8"), "Missing correct content type")
        } catch {
            print(error)
            XCTFail()
        }
    }
    
    func testInvalidGetAuthRequest() {
        let req = HTTPRequest.testable.get(uri: "/auth", headers: ["Bad-Headers": "For-Sure"])
        
        do {
            _ = try app.testable.response(throwingTo: req)
            XCTFail()
        } catch {
            // Should fails
        }
    }
    
    func testValidPostAuthRequest() {
        let req = try! HTTPRequest.testable.post(uri: "/auth", data: User.Auth.Login(email: "admin@liveui.io", password: "admin").asJson(), headers: ["Content-Type": "application/json; charset=utf-8"])
        do {
            let res = try app.testable.response(throwingTo: req)
            
            res.testable.debug()
            
            let data = res.testable.content(as: Token.self)
            XCTAssertNotNil(data, "Token can't be nil")
            if let data = data {
                XCTAssertNotNil(data.id, "Token id can't be nil")
                XCTAssertFalse(data.token.isEmpty, "Token data should be present")
                XCTAssertTrue(data.expires.timeIntervalSince1970 > 0, "Token data should be present")
                XCTAssertFalse(data.userId.uuidString.isEmpty, "Token data should be present")
            }
            
            XCTAssertTrue(res.testable.has(statusCode: .ok), "Wrong status code")
            XCTAssertTrue(res.testable.has(contentType: "application/json; charset=utf-8"), "Missing correct content type")
        } catch {
            print(error)
            XCTFail()
        }
    }
    
    func testInvalidPostAuthRequest() {
        let req = HTTPRequest.testable.post(uri: "/auth", data: Data())
        
        do {
            _ = try app.testable.response(throwingTo: req)
            XCTFail()
        } catch {
            // Should fails
        }
    }
    
}

