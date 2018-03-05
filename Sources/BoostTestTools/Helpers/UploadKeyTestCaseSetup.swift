//
//  UploadKeyTestCaseSetup.swift
//  BoostTestTools
//
//  Created by Ondrej Rafaj on 05/03/2018.
//

import Foundation
import XCTest
import Vapor
import VaporTestTools
import FluentTestTools
import ApiCoreTestTools
@testable import ApiCore
@testable import BoostCore


public protocol UploadKeyTestCase: TeamsTestCase {
    var app: Application! { get }
    var user1: User! { get set }
    var user2: User! { get set }
}


extension UploadKeyTestCase {
    
    public func setupUploadKeys() {
        app.testable.delete(allFor: UploadKey.self)
        
        setupTeams()
        
        let req = app.testable.fakeRequest()
        
        let adminTeam = Team.testable.create("Admin team", on: app)
        
        user1 = User.testable.createSu(on: app)
        _ = try! adminTeam.users.attach(user1, on: req).await(on: req)
        
        let authenticationCache = try! app.make(AuthenticationCache.self, for: Request.self)
        authenticationCache[User.self] = user1
        
        user2 = User.testable.create(on: app)
        _ = try! adminTeam.users.attach(user2, on: req).await(on: req)
    }
    
}

