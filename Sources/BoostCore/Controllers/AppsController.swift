//
//  AppsController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 12/12/2017.
//

import Foundation
import Vapor
import ApiCore
import Fluent
import FluentPostgreSQL
import DbCore
import ErrorsCore
import FileCore
import SwiftShell


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
        
        router.get("apps", DbCoreIdentifier.parameter, "auth") { (req) -> Future<Response> in
            let id = try req.parameter(DbCoreIdentifier.self)
            
            return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                return appQuery(appId: id, db: db).first().flatMap(to: Response.self) { (app) -> Future<Response> in
                    guard let appId = app?.id else {
                        throw ContentError.unavailable
                    }
                    let key = DownloadKey(appId: appId)
                    let originalToken: String = key.token
                    key.token = try key.token.passwordHash(req)
                    // TODO: Delete all expired tokens so the DB won't die on us after a few months!!!!!!!!
                    return key.save(on: db).map(to: Response.self, { (key) -> Response in
                        let response = try req.response.basic(status: .ok)
                        key.token = originalToken
                        response.http.body = try HTTPBody(DownloadKey.Public(downloadKey: key, request: req).asJson())
                        return response
                    })
                }
            }
        }
        
        router.get("apps", DbCoreIdentifier.parameter, "plist") { (req) -> Future<Response> in
            let id = try req.parameter(DbCoreIdentifier.self)
            
            return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                return appQuery(appId: id, db: db).first().map(to: Response.self) { (app) -> Response in
                    guard let app = app else {
                        throw ContentError.unavailable
                    }
                    let response = try req.response.basic(status: .ok)
                    response.http.headers = HTTPHeaders(dictionaryLiteral: (.contentType, "application/xml; charset=utf-8"))
                    response.http.body = try HTTPBody(AppPlist(app: app, request: req).asPropertyList())
                    return response
                }
            }
        }
        
        // TODO: Return an actual file!
        router.get("apps", DbCoreIdentifier.parameter, "file") { (req) -> Future<App> in
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
        
        router.delete("apps", DbCoreIdentifier.parameter) { (req) -> Future<Response> in
            let id = try req.parameter(DbCoreIdentifier.self)
            
            return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                return appQuery(appId: id, db: db).first().flatMap(to: Response.self) { (app) -> Future<Response> in
                    guard let app: App = app else {
                        throw ContentError.unavailable
                    }
                    
                    guard let appId = app.id else {
                        throw GenericError.impossibleSituation
                    }
                    // TODO: Delete all tags (if they don't have any more parent apps)
                    return app.delete(on: db).flatMap(to: Response.self, { (app) -> Future<Response> in
                        return try Boost.config.fileHandler.delete(file: appId.uuidString).asResponse(to: req)
                    })
                }
            }
        }
        
        router.post("apps", "upload") { (req) -> Future<Response> in
            let token: String
            if Boost.uploadsRequireKey {
                guard let t = try req.http.headers.authorizationToken?.passwordHash(req) else {
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
                return UploadKey.query(on: db).filter(\.token == token).first().flatMap(to: Response.self) { (matchingToken) -> Future<Response> in
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
                    return App.query(on: req).first().flatMap(to: Response.self) { (app) -> Future<Response> in
                        // TODO: Change to copy file when https://github.com/vapor/core/pull/83 is done
                        return req.http.body.makeData(max: Filesize.gigabyte(1).value).flatMap(to: Response.self) { (data) -> Future<Response> in
                            // TODO: -------- REFACTOR ---------
                            let uuid = UUID()
                            var path = URL(fileURLWithPath: "/tmp/Boost")
                            try FileManager.default.createDirectory(at: path, withIntermediateDirectories: true)
                            path = path.appendingPathComponent(uuid.uuidString).appendingPathExtension("boost")
                            try data.write(to: path)
                            let output: RunOutput = SwiftShell.run("unzip", "-Z1", path.path)
                            
                            let platform: App.Platform
                            if output.succeeded {
                                print(output.stdout)
                                
                                if output.stdout.contains("Payload/") {
                                    platform = .iOS
                                }
                                else if output.stdout.contains("AndroidManifest.xml") {
                                    platform = .android
                                }
                                else {
                                    throw ExtractorError.invalidAppContent
                                }
                            }
                            else {
                                print(output.stderror)
                                throw ExtractorError.invalidAppContent
                            }
                            // */ -------- REFACTOR END ---------
                            
                            let extractor: Extractor = try BaseExtractor.decoder(file: path.path, platform: platform)
                            do {
                                let promise: Promise<App> = try extractor.process(teamId: uploadToken.teamId)
                                return promise.future.flatMap(to: Response.self) { (app) -> Future<Response> in
                                    return app.save(on: db).flatMap(to: Response.self) { (app) -> Future<Response> in
                                        // TODO: Remove the force unwrap!!!
                                        return try extractor.save(app, Boost.config.fileHandler).flatMap(to: Response.self) { (_) -> Future<Response> in
                                            try FileManager.default.removeItem(at: path) // Remove after refactor
                                            
                                            // Save tags
                                            return handleTags(db: db, request: req, app: app).flatMap(to: Response.self) { (_) -> Future<Response> in
                                                return try app.asResponse(.created, to: req)
                                            }
                                        }
                                    }
                                }
                            } catch {
                                // Clean files
                                try extractor.cleanUp()
                                try FileManager.default.removeItem(at: path) // Remove after refactor
                                throw error
                            }
                        }
                    }
                }
            }
        }
    }
    
}


extension AppsController {
    
    static func appQuery(appId: DbCoreIdentifier, db: DbCoreConnection) -> QueryBuilder<App> {
        return App.query(on: db).filter(\App.id == appId)
    }
    
    static func handleTags(db: DbCoreConnection, request req: Request, app: App) -> Future<Void> {
        if let query = try? req.query.decode([String: String].self) {
            if let tags = query["tags"]?.split(separator: "|") {
                var futures: [Future<Void>] = []
                // TODO: Optimise to work without the for loop
                for tagSubstring in tags {
                    let tag = String(tagSubstring)
                    let future = Tag.query(on: db).filter(\Tag.identifier == tag).first().flatMap(to: Void.self, { (tagObject) -> Future<Void> in
                        guard let tagObject = tagObject else {
                            let t = Tag(id: nil, name: tag, identifier: tag.safeText)
                            return t.save(on: db).flatMap(to: Void.self, { (tag) -> Future<Void> in
                                return app.tags.attach(tag, on: db).flatten()
                            })
                        }
                        return app.tags.attach(tagObject, on: db).flatten()
                    })
                    futures.append(future)
                }
                return futures.flatten()
            }
        }
        return Future(Void())
    }
    
}
