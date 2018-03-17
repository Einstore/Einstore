//
//  TeamsTestCase.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 01/03/2018.
//

import Foundation
import XCTest
import Vapor
import VaporTestTools
import ApiCore


public protocol TeamsTestCase: UsersTestCase {
    var team1: Team! { get set }
    var team2: Team! { get set }
}


extension TeamsTestCase {
    
    public func setupTeams() {
        setupUsers()
        
        let req = app.testable.fakeRequest()
        
        team1 = Team.testable.create("team 1", on: app)
        _ = try! team1.users.attach(user1, on: req).wait()
        
        team2 = Team.testable.create("team 2", on: app)
        _ = try! team2.users.attach(user2, on: req).wait()
    }
    
}
