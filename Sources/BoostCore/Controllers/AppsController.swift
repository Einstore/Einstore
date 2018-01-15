//
//  AppsController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 12/12/2017.
//

import Foundation
import Vapor
import ApiCore
import FluentMySQL
import DbCore


class AppsController: Controller {
    
    static func boot(router: Router) throws {
        router.post("upload") { (req) -> Future<App> in
            return App.query(on: req).first().flatMap(to: App.self, { (app) -> Future<App> in
                let extractor: Extractor = try Ipa(file: URL(fileURLWithPath: "/Users/pro/Desktop/Desktop - Dictator/Builds/app.ipa"))
                return try extractor.process().map(to: App.self, { app in
                    guard let app = app else {
                        throw ExtractorError.invalidAppContent
                    }
                    return app
                })
            })
        }
    }
    
}
