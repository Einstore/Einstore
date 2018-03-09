//
//  UsersControllerTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 28/02/2018.
//

import Foundation
import XCTest
@testable import ApiCore
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
        ("testLinuxTests", testLinuxTests),
        ("testGetUsers", testGetUsers),
        ("testRegisterUser", testRegisterUser),
        ("testSearchUsersWithoutParams", testSearchUsersWithoutParams)
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
        let req = HTTPRequest.testable.get(uri: "/users", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        let users = r.response.testable.content(as: [User].self)!
        XCTAssertEqual(users.count, 2, "There should be two users in the database")
        XCTAssertTrue(users.contains(where: { (user) -> Bool in
            return user.id == user1.id && user.id != nil
        }), "Newly created user is not present in the database")
        XCTAssertTrue(users.contains(where: { (user) -> Bool in
            return user.id == user2.id && user.id != nil
        }), "Newly created user is not present in the database")
    }
    
    func testRegisterUser() {
        let post = User.Registration(firstname: "Lemmy", lastname: "Kilmister", email: "lemmy@liveui.io", password: "passw0rd")
        let req = try! HTTPRequest.testable.post(uri: "/users", data: post.asJson(), headers: [
            "Content-Type": "application/json; charset=utf-8"
            ]
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        // Check returned data
        let object = r.response.testable.content(as: User.Display.self)!
        XCTAssertEqual(object.firstname, post.firstname, "Firstname doesn't match")
        XCTAssertEqual(object.lastname, post.lastname, "Lastname doesn't match")
        XCTAssertEqual(object.email, post.email, "Email doesn't match")
        
        // Check it has been actually saved
        let user = app.testable.one(for: User.self, id: object.id!)!
        XCTAssertEqual(user.firstname, post.firstname, "Firstname doesn't match")
        XCTAssertEqual(user.lastname, post.lastname, "Lastname doesn't match")
        XCTAssertEqual(user.email, post.email, "Email doesn't match")
        XCTAssertEqual(user.password, try! post.password.passwordHash(r.request), "Password doesn't match")
        XCTAssertEqual(user.disabled, false, "Disabled should be false")
        XCTAssertEqual(user.su, false, "SU should be false")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .created), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
    }
    
    func testSearchUsersWithoutParams() {
        let req = HTTPRequest.testable.get(uri: "/users/search", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        let users = r.response.testable.content(as: [User.AllSearch].self)!
        XCTAssertEqual(users.count, 2, "There should be two users in the database")
        XCTAssertEqual(users[0].id, user1.id, "Avatar is not in the correct format")
        XCTAssertEqual(users[0].avatar, "https://www.gravatar.com/avatar/e7e8b7ac59a724a481bec410d0cb44a4", "Avatar is not in the correct format")
    }
    
}
