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
import NIO


public protocol AppTestCaseSetup: UploadKeyTestCaseSetup {
    var app1: App! { get set }
    var app2: App! { get set }
}


extension AppTestCaseSetup {
    
    var demoUrl: URL {
        let config = DirectoryConfig.detect()
        var url: URL = URL(fileURLWithPath: config.workDir).appendingPathComponent("Resources")
        url.appendPathComponent("Demo")
        return url
    }
    
    public func setupApps() {
        app.testable.delete(allFor: App.self)
        
        setupUploadKeys()
        
        app1 = App.testable.create(team: team1, name: "App 1", version: "1.2.3", build: "123456", platform: .ios, on: app)
        app1.testable.addTag(name: "common tag", identifier: "common-tag", on: app)
        app1.testable.addTag(name: "tag for app 1", identifier: "tag-for-app-1", on: app)
        
        try! Boost.storageFileHandler.createFolderStructure(url: app1.targetFolderPath!)
//        try! Boost.storageFileHandler.copy(from:demoUrl.appendingPathComponent("app.ipa").path, to: app1.appPath!)
        
        app2 = App.testable.create(team: team2, name: "App 2", identifier: "app2", version: "3.2.1", build: "654321", platform: .android, on: app)
        app2.testable.addTag(name: "common tag", identifier: "common-tag", on: app)
        app2.testable.addTag(name: "tag for app 2", identifier: "tag-for-app-2", on: app)
        
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
//        try! Boost.storageFileHandler.delete(path: Boost.config.storageFileConfig.mainFolderPath)
//        try! Boost.storageFileHandler.delete(path: Boost.config.tempFileConfig.mainFolderPath)
    }
    
}

