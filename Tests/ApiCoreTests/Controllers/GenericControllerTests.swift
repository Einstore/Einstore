//
//  GenericControllerTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import XCTest
import Vapor
import VaporTestTools
import ApiCoreTestTools


class GenericControllerTests: XCTestCase {
    
    var app: Application!
    
    // MARK: Setup
    
    override func setUp() {
        super.setUp()
        
        app = Application.testable.newApiCoreTestApp()
    }
    
    // MARK: Tests
    
    func testPing() {
        let req = HTTPRequest.testable.get(uri: "/ping")
        let res = app.testable.response(to: req)
        
        res.testable.debug()
        
        XCTAssertTrue(res.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(res.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        XCTAssertTrue(res.testable.has(contentLength: 15), "Wrong content length")
        XCTAssertTrue(res.testable.has(content: "{\"code\":\"pong\"}"), "Incorrect content")
    }
    
    func testTeapot() {
        let req = Request.testable.http.get(uri: "/teapot")
        let res = app.testable.response(to: req)
        
        res.testable.debug()
        
        XCTAssertTrue(res.testable.has(statusCode: 418), "Wrong status code")
        XCTAssertTrue(res.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        XCTAssertTrue(res.testable.has(contentLength: 178), "Wrong content length")
    }
    
    func testTables() {
        let req = Request.testable.http.get(uri: "/tables")
        let res = app.testable.response(to: req)

        res.testable.debug()
    }
    
}
