//
//  UploadKey+Testable.swift
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


extension TestableProperty where TestableType == UploadKey {
    
    @discardableResult public static func create(name: String, team: Team, expires: Date? = nil, on app: Application) -> UploadKey {
        let req = app.testable.fakeRequest()
        let key = UploadKey(teamId: team.id!, name: name, expires: expires)
        return try! key.save(on: req).await(on: req)
    }
    
}
