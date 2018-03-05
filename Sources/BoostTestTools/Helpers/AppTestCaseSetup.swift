//
//  AppTestCaseSetup.swift
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


public protocol AppTestCaseSetup: UploadKeyTestCaseSetup {
    var app1: App! { get set }
    var app2: App! { get set }
}


extension AppTestCaseSetup {
    
    public func setupApps() {
        app.testable.delete(allFor: App.self)
        
        setupUploadKeys()
        
        app1 = App.testable.create(team: team1, name: "App 1", version: "1.2.3", build: "123456", platform: .ios, on: app)
        app2 = App.testable.create(team: team1, name: "App 2", identifier: "app2", version: "3.2.1", build: "654321", platform: .android, on: app)
        
        for x in 0...6 {
            for i in 0...6 {
                App.testable.create(team: team1, name: "App ios \(i)", version: "1.\(x).\(i)", build: "\((1000 + i))", platform: .ios, on: app)
            }
            
            for i in 0...6 {
                App.testable.create(team: team1, name: "App android \(i)", version: "1.\(x).\(i)", build: "\((1000 + i))", platform: .android, on: app)
            }
        }
        
        for i in 0...6 {
            App.testable.create(team: team2, name: "App android \(i)", version: "2.0.\(i)", build: "\((1000 + i))", platform: .android, on: app)
        }
    }
    
    public func deleteAllFiles() {
        
    }
    
}

