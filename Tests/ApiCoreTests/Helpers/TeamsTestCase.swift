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


protocol TeamsTestCase: UsersTestCase {
    var app: Application! { get }
    var team1: Team! { get set }
    var team2: Team! { get set }
}


extension TeamsTestCase {
    
    func setupTeams() {
        setupUsers()
        
        let req = app.testable.fakeRequest()
        
        team1 = Team.testable.create("team 1", on: app)
        _ = try! team1.users.attach(user1, on: req).await(on: req)
        
        team2 = Team.testable.create("team 2", on: app)
        _ = try! team2.users.attach(user2, on: req).await(on: req)
    }
    
}
