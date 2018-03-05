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
@testable import BoostCore


class UploadKeyControllerTests: XCTestCase, UploadKeyTestCaseSetup, LinuxTests {

    var app: Application!
    
    var user1: User!
    var user2: User!
    
    var team1: Team!
    var team2: Team!
    
    var key1: UploadKey!
    var key2: UploadKey!
    var key3: UploadKey!
    
    // MARK: Linux
    
    static let allTests: [(String, Any)] = [
        ("testGetUploadKeysForUser", testGetUploadKeysForUser),
        ("testGetUploadKeysForTeam", testGetUploadKeysForTeam),
        ("testCreateUploadKey", testCreateUploadKey),
        ("testChangeUploadKeyName", testChangeUploadKeyName),
        ("testDeleteUploadKey", testDeleteUploadKey),
        ("testGetOneUploadKey", testGetOneUploadKey),
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
    
    func testGetUploadKeysForUser() {
        let req = HTTPRequest.testable.get(uri: "/users", authorizedUser: user1, on: app)
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
    
    func testGetUploadKeysForTeam() {
        
    }
    
    func testCreateUploadKey() {
        
    }
    
    func testChangeUploadKeyName() {
        
    }
    
    func testDeleteUploadKey() {
        
    }
    
    func testGetOneUploadKey() {
        
    }
    
}


