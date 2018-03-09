//
//  GenericControllerTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import XCTest
import Vapor
import ApiCore
import VaporTestTools
import ApiCoreTestTools


class GenericControllerTests: XCTestCase, UsersTestCase, LinuxTests {
    
    var app: Application!
    
    var user1: User!
    var user2: User!
    
    // MARK: Linux
    
    static let allTests: [(String, Any)] = [
        ("testUnknownGet", testUnknownGet),
        ("testUnknownPost", testUnknownPost),
        ("testUnknownPut", testUnknownPut),
        ("testUnknownPatch", testUnknownPatch),
        ("testUnknownDelete", testUnknownDelete),
        ("testPing", testPing),
        ("testTeapot", testTeapot),
        ("testTables", testTables),
        ("testLinuxTests", testLinuxTests)
    ]
    
    func testLinuxTests() {
        doTestLinuxTestsAreOk()
    }
    
   // MARK: Setup
    
    override func setUp() {
        super.setUp()
        
        app = Application.testable.newApiCoreTestApp()
        
        setupUsers()
    }
    
    // MARK: Tests
    
    func testUnknownGet() {
        let req = HTTPRequest.testable.get(uri: "/unknown", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        testUnknown(response: r.response)
    }
    
    func testUnknownPost() {
        let req = HTTPRequest.testable.post(uri: "/unknown", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        testUnknown(response: r.response)
    }
    
    func testUnknownPut() {
        let req = HTTPRequest.testable.put(uri: "/unknown", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        testUnknown(response: r.response)
    }
    
    func testUnknownPatch() {
        let req = HTTPRequest.testable.patch(uri: "/unknown", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        testUnknown(response: r.response)
    }
    
    func testUnknownDelete() {
        let req = HTTPRequest.testable.delete(uri: "/unknown", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        testUnknown(response: r.response)
    }
    
    func testPing() {
        let req = HTTPRequest.testable.get(uri: "/ping")
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        XCTAssertTrue(r.response.testable.has(contentLength: 15), "Wrong content length")
        XCTAssertTrue(r.response.testable.has(content: "{\"code\":\"pong\"}"), "Incorrect content")
    }
    
    func testTeapot() {
        let req = Request.testable.http.get(uri: "/teapot")
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        XCTAssertTrue(r.response.testable.has(statusCode: 418), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        XCTAssertTrue(r.response.testable.has(contentLength: 178), "Wrong content length")
    }
    
    func testTables() {
        let req = Request.testable.http.get(uri: "/tables")
        let r = app.testable.response(to: req)

        r.response.testable.debug()
    }
    
}


extension GenericControllerTests {
    
    private func testUnknown(response res: Response) {
        res.testable.debug()
        
        XCTAssertTrue(res.testable.has(statusCode: .notFound), "Wrong status code. Should be not found (404)")
    }
    
}
