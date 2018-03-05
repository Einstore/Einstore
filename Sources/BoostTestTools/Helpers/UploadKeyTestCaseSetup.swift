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
    var app: Application! { get }
    
    var key1: UploadKey! { get set }
    var key2: UploadKey! { get set }
    var key3: UploadKey! { get set }
}


extension UploadKeyTestCaseSetup {
    
    public func setupUploadKeys() {
        app.testable.delete(allFor: UploadKey.self)
        
        setupTeams()
        
        let req = app.testable.fakeRequest()
        
        key1 = UploadKey.testable.create(name: "key1", team: team1, on: app)
        key2 = UploadKey.testable.create(name: "key2", team: team1, on: app)
        key3 = UploadKey.testable.create(name: "key3", team: team2, on: app)
    }
    
}

