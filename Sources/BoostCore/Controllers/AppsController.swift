//
//  AppsController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 12/12/2017.
//

import Foundation
import Vapor
import ApiCore
import FluentPostgreSQL
import DbCore
import ErrorsCore


class AppsController: Controller {
    
    static func boot(router: Router) throws {
        router.get("apps") { (req) -> Future<[App]> in
            return req.withPooledConnection(to: .db) { (db) -> Future<[App]> in
                return App.query(on: db).all()
            }
        }
        
        router.get("apps", DbCoreIdentifier.parameter) { (req) -> Future<App> in
            let id = try req.parameter(DbCoreIdentifier.self)
            
            return req.withPooledConnection(to: .db) { (db) -> Future<App> in
                return appQuery(appId: id, db: db).first().map(to: App.self, { (app) -> App in
                    guard let app = app else {
                        throw ContentError.unavailable
                    }
                    return app
                })
            }
        }
        
        router.get("apps", DbCoreIdentifier.parameter, "tags") { (req) -> Future<[Tag]> in
            let id = try req.parameter(DbCoreIdentifier.self)
            
            return req.withPooledConnection(to: .db) { (db) -> Future<[Tag]> in
                return appQuery(appId: id, db: db).first().flatMap(to: [Tag].self, { (app) -> Future<[Tag]> in
                    guard let app: App = app else {
                        throw ContentError.unavailable
                    }
                    return try app.tags.query(on: db).all()
                })
            }
        }
        
        ApiAuthMiddleware.allowedUri.append("/apps/upload")
        router.post("apps", "upload") { (req) -> Future<Response> in
            let token: String
            if Boost.uploadsRequireKey {
                guard let t = req.http.headers.authorizationToken?.passwordHash else {
                    throw ErrorsCore.HTTPError.missingAuthorizationData
                }
                token = t
            }
            else {
                token = "XXXX-XXXX-XXXX-XXXX"
            }
            
            // TODO: Make this a proper teamId by checking the API key
            let teamId = DbCoreIdentifier()
            
            return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                return UploadKey.query(on: db).filter(\.token == token).first().flatMap(to: Response.self, { (matchingToken) -> Future<Response> in
                    let uploadToken: UploadKey
                    if Boost.uploadsRequireKey {
                        guard let t = matchingToken else {
                            throw AuthError.authenticationFailed
                        }
                        uploadToken = t
                    }
                    else {
                        uploadToken = UploadKey(id: nil, teamId: teamId, name: "test", expires: nil, token: token)
                    }
                    return App.query(on: req).first().flatMap(to: Response.self, { (app) -> Future<Response> in
                        //let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/bytecheck-debug.apk"
                        //let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/AudiA6BiTurbo.ipa"
                        //let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/harods-rc2-b1-15-android.apk"
                        let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/HandyFleshlight WatchKit App 2017-01-05 10-10-35/HandyFleshlight WatchKit App.ipa"
                        //let path = "/Users/pro/Desktop/Desktop - Dictator/Builds/app.ipa"
                        
                        let extractor: Extractor = try BaseExtractor.decoder(file: path)
                        do {
                            let promise: Promise<App> = try extractor.process(teamId: uploadToken.teamId)
                            return promise.future.flatMap(to: Response.self, { (app) -> Future<Response> in
                                return app.save(on: db).flatMap(to: Response.self) { (Response) -> Future<Response> in
                                    // Save files
                                    try extractor.save()
                                    
                                    // Save tokens
                                    if let query = try? req.query.decode([String: String].self) {
                                        print(query)
                                    }
                                    
                                    return try app.asResponse(.created, to: req)
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


extension AppsController {
    
    static func appQuery(appId: DbCoreIdentifier, db: DbCoreConnection) -> QueryBuilder<App> {
        return App.query(on: db).filter(\App.id == appId)
    }
    
}
