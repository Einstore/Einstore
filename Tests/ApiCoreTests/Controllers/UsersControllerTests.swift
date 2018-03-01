//
//  UsersControllerTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 28/02/2018.
//

import Foundation
import XCTest
import ApiCore
import Vapor
import VaporTestTools
import FluentTestTools
import ApiCoreTestTools


class UsersControllerTests: XCTestCase, UsersTestCase, LinuxTests {
    
    var app: Application!
    
    var user1: User!
    var user2: User!
    
    // MARK: Linux
    
    static let allTests: [(String, Any)] = [
        ("testGetUsers", testGetUsers),
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
    
    func testGetUsers() {
        let req = HTTPRequest.testable.get(uri: "/users")
        let res = app.testable.response(to: req)

        res.testable.debug()

        XCTAssertTrue(res.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(res.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        let users = res.testable.content(as: [User].self)!
        XCTAssertEqual(users.count, 2, "There should be two users in the database")
        XCTAssertTrue(users.contains(where: { (user) -> Bool in
            return user.id == user1.id && user.id != nil
        }), "Newly created user is not present in the database")
        XCTAssertTrue(users.contains(where: { (user) -> Bool in
            return user.id == user2.id && user.id != nil
        }), "Newly created user is not present in the database")
    }
    
}
