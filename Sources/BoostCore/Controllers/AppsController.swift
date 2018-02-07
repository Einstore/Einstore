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
        router.post("apps", "upload") { (req) -> Future<App> in
            // TODO: Check an upload key!
            return req.withPooledConnection(to: .db) { (db) -> Future<App> in
                return App.query(on: req).first().flatMap(to: App.self, { (app) -> Future<App> in
//                    _ = req.http.body.makeData(max: ApiCore.configuration.maxUploadSize.value).map(to: Void.self, { (data) -> Void in
                    
                    let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/bytecheck-debug.apk"
                    //let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/app.ipa"
                    
                    let extractor: Extractor = try BaseExtractor.decoder(file: path)
                    do {
                        let promise: Promise<App> = try extractor.process(teamId: 1)
                        return promise.future.flatMap(to: App.self, { (app) -> Future<App> in
                            return app.save(on: db).map(to: App.self) { (app) -> App in
                                return app
                            }
                        })
                    } catch {
                        print(error.localizedDescription)
                        try extractor.cleanUp()
                        throw error
                    }
                })
            }
        }
    }
    
}
