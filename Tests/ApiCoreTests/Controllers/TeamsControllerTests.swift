//
//  TeamsControllerTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 01/03/2018.
//

import Foundation
import XCTest
import ApiCore
import Vapor
import VaporTestTools
import FluentTestTools
import ApiCoreTestTools
import ErrorsCore


class TeamsControllerTests: XCTestCase, TeamsTestCase, LinuxTests {
    
    var app: Application!
    
    var team1: Team!
    var team2: Team!
    
    var user1: User!
    var user2: User!
    
    // MARK: Linux
    
    static let allTests: [(String, Any)] = [
        ("testLinuxTests", testLinuxTests),
        ("testGetTeams", testGetTeams),
        ("testCreateTeam", testCreateTeam),
        ("testValidTeamNameCheck", testValidTeamNameCheck),
        ("testInvalidTeamNameCheck", testInvalidTeamNameCheck),
        ("testGetSingleTeam", testGetSingleTeam),
        ("testUpdateSingleTeam", testUpdateSingleTeam),
        ("testPatchSingleTeam", testPatchSingleTeam),
        ("testDeleteSingleTeam", testDeleteSingleTeam),
        ("testUnableToDeleteOtherPeoplesTeam", testUnableToDeleteOtherPeoplesTeam),
        ("testLinkUser", testLinkUser),
        ("testTryLinkUserWhereHeIs", testTryLinkUserWhereHeIs),
        ("testLinkUserThatDoesntExist", testLinkUserThatDoesntExist),
        ("testUnlinkYourselfWhenLastUser", testUnlinkYourselfWhenLastUser),
        ("testUnlinkUser", testUnlinkUser),
        ("testUnlinkUserThatDoesntExist", testUnlinkUserThatDoesntExist),
        ("testTryUnlinkUserWhereHeIsNot", testTryUnlinkUserWhereHeIsNot),
        ("testGetTeamUsers", testGetTeamUsers)
    ]
    
    func testLinuxTests() {
        doTestLinuxTestsAreOk()
    }
    
    // MARK: Setup
    
    override func setUp() {
        super.setUp()
        
        app = Application.testable.newApiCoreTestApp()
        
        setupTeams()
    }
    
    // MARK: Tests
    
    func testGetTeams() {
        let req = HTTPRequest.testable.get(uri: "/teams", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        let realTeams = app.testable.all(for: Team.self)
        print(realTeams)
        
        let teams = r.response.testable.content(as: [Team].self)!
        XCTAssertEqual(teams.count, 2, "There should be two teams in the database")
        XCTAssertTrue(teams.contains(where: { (team) -> Bool in
            return team.id == team1.id && team.id != nil
        }), "Newly created team is not present in the database")
        XCTAssertFalse(teams.contains(where: { (team) -> Bool in
            return team.id == team2.id && team.id != nil
        }), "Team 2 should not be visible")
    }
    
    func testCreateTeam() {
        // Test setup
        var count = app.testable.count(allFor: Team.self)
        XCTAssertEqual(count, 3, "There should be two team entries in the db at the beginning")
        
        // Test current status of the ME user
        let fakeReq = app.testable.fakeRequest()
        let me = try! fakeReq.me.user()
        count = try! me.teams.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 2, "User should not have 1 team attached")
        
        // Execute request
        let post = Team(name: "team 3", identifier: "team-3")
        let postData = try! post.asJson()
        let req = HTTPRequest.testable.post(uri: "/teams", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ] , authorizedUser: user1, on: app
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        if let team = testTeam(res: r.response, originalTeam: post) {
            // Test team has been attached to the ME user
            let allUsers = try! team.users.query(on: fakeReq).all().wait()
            XCTAssertEqual(allUsers.count, 1, "Team should have 1 user attached")
            XCTAssertEqual(allUsers[0].id, me.id, "Team should have ME user attached")
            
            // Test the rest!
            XCTAssertTrue(r.response.testable.has(statusCode: .created), "Wrong status code")
            
            count = app.testable.count(allFor: Team.self)
            XCTAssertEqual(count, 4, "There should be three team entries in the db")
        }
    }
    
    func testValidTeamNameCheck() {
        let postData = try! Team.Identifier(identifier: "unique-name").asJson()
        let req = HTTPRequest.testable.post(uri: "/teams/check", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ]
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let data = r.response.testable.content(as: SuccessResponse.self)!
        XCTAssertEqual(data.code, "ok")
        XCTAssertEqual(data.description, "Identifier available")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
    }
    
    func testInvalidTeamNameCheck() {
        let postData = try! Team.Identifier(identifier: "team-1").asJson()
        let req = HTTPRequest.testable.post(uri: "/teams/check", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ]
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let data = r.response.testable.content(as: ErrorResponse.self)!
        XCTAssertEqual(data.error, "app_error")
        XCTAssertEqual(data.description, "Identifier already exists")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .conflict), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
    }
    
    func testLinkUser() {
        let fakeReq = app.testable.fakeRequest()
        var count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two user at the beginning")
        
        var user = User(firstname: "Test", lastname: "User", email: "test.user1@liveui.io")
        user = User.testable.create(user: user, on: app)
        
        let postData = try! User.Id(id: user.id!).asJson()
        let req = HTTPRequest.testable.post(uri: "/teams/\(team1.id!.uuidString)/link", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ], authorizedUser: user1, on: app
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let data = r.response.testable.content(as: SuccessResponse.self)!
        XCTAssertEqual(data.code, "ok")
        XCTAssertEqual(data.description, "User has been added to the team")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 2, "Team should have two users at the end")
    }
    
    func testTryLinkUserWhereHeIs() {
        let fakeReq = app.testable.fakeRequest()
        var count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two user at the beginning")
        
        let postData = try! User.Id(id: user1.id!).asJson()
        let req = HTTPRequest.testable.post(uri: "/teams/\(team1.id!.uuidString)/link", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ], authorizedUser: user1, on: app
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let data = r.response.testable.content(as: ErrorResponse.self)!
        XCTAssertEqual(data.error, "team_error")
        XCTAssertEqual(data.description, "User is already a member of the team")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .conflict), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two users at the end")
    }
    
    func testLinkUserThatDoesntExist() {
        let fakeReq = app.testable.fakeRequest()
        var count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two user at the beginning")
        
        let postData = try! User.Id(id: UUID()).asJson()
        let req = HTTPRequest.testable.post(uri: "/teams/\(team1.id!.uuidString)/link", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ], authorizedUser: user1, on: app
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let data = r.response.testable.content(as: ErrorResponse.self)!
        XCTAssertEqual(data.error, "team_error")
        XCTAssertEqual(data.description, "User not found")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .notFound), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two users at the end")
    }
    
    func testUnlinkUser() {
        var user = User(firstname: "Test", lastname: "User", email: "test.user1@liveui.io")
        user = User.testable.create(user: user, on: app)
        let fakeReq = app.testable.fakeRequest()
        _ = try! team1.users.attach(user, on: fakeReq).wait()
        
        var count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 2, "Team should have two user at the beginning")
        
        let postData = try! User.Id(id: user1.id!).asJson()
        let req = HTTPRequest.testable.post(uri: "/teams/\(team1.id!.uuidString)/unlink", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ], authorizedUser: user1, on: app
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let data = r.response.testable.content(as: SuccessResponse.self)!
        XCTAssertEqual(data.code, "ok")
        XCTAssertEqual(data.description, "User has been removed from the team")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two users at the end")
    }
    
    func testUnlinkYourselfWhenLastUser() {
        let fakeReq = app.testable.fakeRequest()
        var count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two user at the beginning")
        
        let postData = try! User.Id(id: user1.id!).asJson()
        let req = HTTPRequest.testable.post(uri: "/teams/\(team1.id!.uuidString)/unlink", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ], authorizedUser: user1, on: app
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let data = r.response.testable.content(as: ErrorResponse.self)!
        XCTAssertEqual(data.error, "team_error")
        XCTAssertEqual(data.description, "You are the last user in this team; Please delete the team instead")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .conflict), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two users at the end")
    }
    
    func testUnlinkUserThatDoesntExist() {
        let fakeReq = app.testable.fakeRequest()
        var count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two user at the beginning")
        
        let postData = try! User.Id(id: UUID()).asJson()
        let req = HTTPRequest.testable.post(uri: "/teams/\(team1.id!.uuidString)/unlink", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ], authorizedUser: user1, on: app
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let data = r.response.testable.content(as: ErrorResponse.self)!
        XCTAssertEqual(data.error, "team_error")
        XCTAssertEqual(data.description, "User not found")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .notFound), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two users at the end")
    }
    
    func testTryUnlinkUserWhereHeIsNot() {
        let fakeReq = app.testable.fakeRequest()
        var count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two user at the beginning")
        
        let postData = try! User.Id(id: user2.id!).asJson()
        let req = HTTPRequest.testable.post(uri: "/teams/\(team1.id!.uuidString)/unlink", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ], authorizedUser: user1, on: app
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let data = r.response.testable.content(as: ErrorResponse.self)!
        XCTAssertEqual(data.error, "team_error")
        XCTAssertEqual(data.description, "User is not a member of the team")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .conflict), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        count = try! team1.users.query(on: fakeReq).count().wait()
        XCTAssertEqual(count, 1, "Team should have two users at the end")
    }
    
    func testGetSingleTeam() {
        let req = HTTPRequest.testable.get(uri: "/teams/\(team1.id!.uuidString)", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        testTeam(res: r.response)
        
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
    }
    
    func testGetTeamUsers() {
        let req = HTTPRequest.testable.get(uri: "/teams/\(team1.id!.uuidString)/users", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let users = r.response.testable.content(as: [User].self)!
        XCTAssertEqual(users.count, 1, "Team 1 should have 1 user")
        XCTAssertTrue(users.contains(user1), "Team 1 should contain User 1")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
    }
    
    func testUpdateSingleTeam() {
        let testName = "Stay PUT"
        team1.name = testName
        team1.identifier = team1.name.safeText
        
        let postData = try! team1.asJson()
        let req = HTTPRequest.testable.put(uri: "/teams/\(team1.id!.uuidString)", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ], authorizedUser: user1, on: app
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        if let data = testTeam(res: r.response) {
            XCTAssertEqual(data.name, testName, "Name of the team doesn't match")
            XCTAssertEqual(data.identifier, testName.safeText, "Identifier of the team doesn't match")
        }
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
    }
    
    // PATCH
    func testPatchSingleTeam() {
        let testName = "team 1"
        let postData = try! team1.asJson()
        let req = HTTPRequest.testable.patch(uri: "/teams/\(team1.id!.uuidString)", data: postData, headers: [
            "Content-Type": "application/json; charset=utf-8"
            ], authorizedUser: user1, on: app
        )
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        if let data = testTeam(res: r.response) {
            XCTAssertEqual(data.name, testName, "Name of the team doesn't match")
            XCTAssertEqual(data.identifier, testName.safeText, "Identifier of the team doesn't match")
        }
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
    }
    
    func testDeleteSingleTeam() {
        let count = app.testable.count(allFor: Team.self)
        XCTAssertEqual(count, 3)
        
        let req = HTTPRequest.testable.delete(uri: "/teams/\(team1.id!.uuidString)", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        XCTAssertTrue(r.response.testable.has(statusCode: .noContent), "Wrong status code")
        
        let all = app.testable.all(for: Team.self)
        XCTAssertEqual(all.count, 2)
        XCTAssertTrue(all.contains(where: { (team) -> Bool in
            team.id == team2.id
        }), "Team 2 should not have been deleted")
    }
    
    func testUnableToDeleteOtherPeoplesTeam() {
        let count = app.testable.count(allFor: Team.self)
        XCTAssertEqual(count, 3)
        
        let req = HTTPRequest.testable.delete(uri: "/teams/\(team2.id!.uuidString)", authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        XCTAssertTrue(r.response.testable.has(statusCode: .notFound), "Wrong status code")
        
        let all = app.testable.all(for: Team.self)
        XCTAssertEqual(all.count, 3)
        XCTAssertTrue(all.contains(where: { (team) -> Bool in
            team.id == team2.id
        }), "Team 2 should not have been deleted")
    }
    
}

extension TeamsControllerTests {
    
    @discardableResult private func testTeam(res: Response, originalTeam: Team? = nil) -> Team? {
        let data = res.testable.content(as: Team.self)
        XCTAssertNotNil(data, "Team can't be nil")
        
        XCTAssertTrue(res.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        if let data = data {
            if let originalTeam = originalTeam {
                XCTAssertEqual(data.identifier, originalTeam.identifier, "Identifier of the team doesn't match")
            }
            else {
                XCTAssertEqual(data.id, team1.id, "Id of the team doesn't match")
            }
            let dbData = app.testable.one(for: Team.self, id: data.id!)
            XCTAssertNotNil(dbData, "Team should have been found in the DB")
            
            return dbData!
        }
        
        XCTFail("This should not happen Yo!")
        
        return nil
    }
    
}
