//
//  UploadKeyTestCaseSetup.swift
//  BoostTestTools
//
//  Created by Ondrej Rafaj on 05/03/2018.
//

import Foundation
import XCTest
import Vapor
import Fluent
import VaporTestTools
import FluentTestTools
import ApiCoreTestTools
@testable import ApiCore
@testable import BoostCore


public protocol UploadKeyTestCaseSetup: TeamsTestCase {
    var key1: UploadKey! { get set }
    var key2: UploadKey! { get set }
    var key3: UploadKey! { get set }
    var key4: UploadKey! { get set }
    
    var team4: Team! { get set }
}


extension UploadKeyTestCaseSetup {
    
    public func setupUploadKeys() {
        app.testable.delete(allFor: UploadKey.self)
        
        setupTeams()
        
        key1 = UploadKey.testable.create(name: "key1", team: team1, on: app)
        key2 = UploadKey.testable.create(name: "key2", team: team1, on: app)
        key3 = UploadKey.testable.create(name: "key3", team: team2, on: app)
        
        let req = app.testable.fakeRequest()
        team4 = Team.testable.create("team 4", on: app)
        _ = try! team4.users.attach(user1, on: req).wait()
        
        key4 = UploadKey.testable.create(name: "key4", team: team4, on: app)
        
    }
    
}

