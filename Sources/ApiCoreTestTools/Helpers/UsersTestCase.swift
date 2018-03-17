//
//  UsersTestCase.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 28/02/2018.
//

import Foundation
import XCTest
import Vapor
import VaporTestTools
import FluentTestTools
@testable import ApiCore


public protocol UsersTestCase: class {
    var app: Application! { get }
    
    var user1: User! { get set }
    var user2: User! { get set }
}


extension UsersTestCase {
    
    public func setupUsers() {
        app.testable.delete(allFor: TeamUser.self)
        app.testable.delete(allFor: Team.self)
        app.testable.delete(allFor: User.self)
        
        let req = app.testable.fakeRequest()
        
        let adminTeam = Team.testable.create("Admin team", on: app)
        
        user1 = User.testable.createSu(on: app)
        _ = try! adminTeam.users.attach(user1, on: req).wait()
        
        let authenticationCache = try! app.make(AuthenticationCache.self, for: Request.self)
        authenticationCache[User.self] = user1
        
        user2 = User.testable.create(on: app)
        _ = try! adminTeam.users.attach(user2, on: req).wait()
    }
    
}
