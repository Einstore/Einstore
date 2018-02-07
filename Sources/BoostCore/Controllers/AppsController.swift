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
import ApiErrors


class AppsController: Controller {
    
    static func boot(router: Router) throws {
        ApiAuthMiddleware.allowedUri.append("/apps/upload")
        
        router.post("apps", "upload") { (req) -> Future<App> in
            let token: String
            if Boost.uploadsRequireKey {
                guard let t = req.http.headers.authorizationToken?.passwordHash else {
                    throw ApiErrors.HTTPError.missingAuthorizationData
                }
                token = t
            }
            else {
                token = "XXXX-XXXX-XXXX-XXXX"
            }
            
            return req.withPooledConnection(to: .db) { (db) -> Future<App> in
                return UploadKey.query(on: db).filter(\.token == token).first().flatMap(to: App.self, { (matchingToken) -> Future<App> in
                    let uploadToken: UploadKey
                    if Boost.uploadsRequireKey {
                        guard let t = matchingToken else {
                            throw AuthError.authenticationFailed
                        }
                        uploadToken = t
                    }
                    else {
                        uploadToken = UploadKey(id: nil, teamId: 1, name: "test", expires: nil, token: token)
                    }
                    return App.query(on: req).first().flatMap(to: App.self, { (app) -> Future<App> in
                        //let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/bytecheck-debug.apk"
                        //let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/AudiA6BiTurbo.ipa"
                        //let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/harods-rc2-b1-15-android.apk"
                        let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/HandyFleshlight WatchKit App 2017-01-05 10-10-35/HandyFleshlight WatchKit App.ipa"
                        //let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/app.ipa"
                        
                        let extractor: Extractor = try BaseExtractor.decoder(file: path)
                        do {
                            let promise: Promise<App> = try extractor.process(teamId: uploadToken.teamId)
                            return promise.future.flatMap(to: App.self, { (app) -> Future<App> in
                                return app.save(on: db).map(to: App.self) { (app) -> App in
                                    // Save files
                                    try extractor.save()
                                    
                                    // Save tokens
                                    if let query = try? req.query.decode([String: String].self) {
                                        print(query)
                                    }
                                    return app
                                }
                            })
                        } catch {
                            print(error.localizedDescription)
                            try extractor.cleanUp()
                            throw error
                        }
                    })
                })
            }
        }
    }
    
}
