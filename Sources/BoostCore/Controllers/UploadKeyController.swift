//
//  UploadKey.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 17/01/2018.
//

import Foundation
import Vapor
import ApiCore
import FluentPostgreSQL
import DbCore


class UploadKeyController: Controller {
    
    static func boot(router: Router) throws {
        
//        router.get("keys") { (req) -> Future<[UploadKey]> in
//            let teams = try req.authInfo.teamIds()
//            return UploadKey.query(on: req).filter(\UploadKey.teamId, in: teams).all()
//        }
        /*
        router.get("keys", DbCoreIdentifier.parameter) { (req) -> Future<App> in
            return App.query(on: req).first().flatMap(to: App.self, { (app) -> Future<App> in
                let extractor: Extractor = try Ipa(file: URL(fileURLWithPath: "/Users/pro/Desktop/Desktop - Dictator/Builds/app.ipa"))
                return try extractor.process()
                })
            })
        }
        
        router.post("keys") { (req) -> Future<App> in
            return App.query(on: req).first().flatMap(to: App.self, { (app) -> Future<App> in
                let extractor: Extractor = try Ipa(file: URL(fileURLWithPath: "/Users/pro/Desktop/Desktop - Dictator/Builds/app.ipa"))
                return try extractor.process().map(to: App.self, { app in
                    guard let app = app.object else {
                        throw ExtractorError.invalidAppContent
                    }
                    return app
                })
            })
        }
        
        router.put("keys", DbCoreIdentifier.parameter) { (req) -> Future<App> in
            return App.query(on: req).first().flatMap(to: App.self, { (app) -> Future<App> in
                let extractor: Extractor = try Ipa(file: URL(fileURLWithPath: "/Users/pro/Desktop/Desktop - Dictator/Builds/app.ipa"))
                return try extractor.process().map(to: App.self, { app in
                    guard let app = app.object else {
                        throw ExtractorError.invalidAppContent
                    }
                    return app
                })
            })
        }
        
        router.delete("keys", DbCoreIdentifier.parameter) { (req) -> Future<App> in
            return App.query(on: req).first().flatMap(to: App.self, { (app) -> Future<App> in
                let extractor: Extractor = try Ipa(file: URL(fileURLWithPath: "/Users/pro/Desktop/Desktop - Dictator/Builds/app.ipa"))
                return try extractor.process().map(to: App.self, { app in
                    guard let app = app.object else {
                        throw ExtractorError.invalidAppContent
                    }
                    return app
                })
            })
        }
        // */
    }
    
}
