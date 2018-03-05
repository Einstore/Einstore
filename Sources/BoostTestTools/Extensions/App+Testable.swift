//
//  App+Testable.swift
//  BoostTestTools
//
//  Created by Ondrej Rafaj on 05/03/2018.
//

import Foundation
import DbCore
import ApiCore
import Vapor
import Fluent
@testable import BoostCore
import VaporTestTools


extension TestableProperty where TestableType == App {
    
    @discardableResult public static func create(team: Team, name: String, identifier: String? = nil, version: String, build: String, platform: App.Platform, on app: Application) -> App {
        let req = app.testable.fakeRequest()
        let object = App(teamId: team.id!, name: name, identifier: (identifier ?? name.safeText), version: version, build: build, platform: platform)
        return try! object.save(on: req).await(on: req)
    }
    
}

