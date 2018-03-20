//
//  Team+Testable.swift
//  ApiCoreTestTools
//
//  Created by Ondrej Rafaj on 01/03/2018.
//

import Foundation
import DbCore
import ApiCore
import Vapor
import Fluent
import VaporTestTools


extension TestableProperty where TestableType == Team {
    
    @discardableResult public static func create(_ name: String, admin: Bool = false, on app: Application) -> Team {
        let team = Team(name: name, identifier: name.safeText, admin: admin)
        return create(team: team, on: app)
    }
    
    @discardableResult public static func create(team: Team, on app: Application) -> Team {
        let req = app.testable.fakeRequest()
        return try! team.save(on: req).wait()
    }
    
}
