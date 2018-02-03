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
        //*
        router.post("apps", "upload") { (req) -> Future<App> in
            return App.query(on: req).first().flatMap(to: App.self, { (app) -> Future<App> in
//                _ = req.http.body.makeData(max: ApiCore.configuration.maxUploadSize.value).map(to: Void.self, { (data) -> Void in
//                    print(data)
//                })
                
                

                
                //let extractor: Extractor = try Ipa(file: URL(fileURLWithPath: "/Users/pro/Desktop/Desktop - Dictator/Builds/app.ipa"))
                
                let extractor: Extractor = try Apk(file: URL(fileURLWithPath: "/Users/pro/Desktop/Desktop - Dictator/Builds/app.ipa"))
                let promise: Promise<App> = try extractor.process()
                
                return promise.future.map(to: App.self, { app in
//                    guard let app = app else {
//                        throw ExtractorError.invalidAppContent
//                    }
                    return app
                })
            })
        }
        // */
    }
    
}
