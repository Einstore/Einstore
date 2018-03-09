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


extension QueryBuilder where Model == App {
    
    func appFilters() -> Self {
        var s = self
        s = s.range(lower: 0, upper: 1000)
//        s = s.filter(\App.platform == App.Platform.ios.rawValue)
        return s
    }
    
    func safeApp(appId: DbCoreIdentifier, teamIds: [DbCoreIdentifier]) -> Self {
        return group(.and) { and in
            and.filter(\App.id == appId)
            and.filter(\App.teamId, in: teamIds)
        }
    }
    
}


class AppsController: Controller {
    
    static func boot(router: Router) throws {
        // Overview
        router.get("apps") { (req) -> Future<Apps> in
            return try req.me.teams().flatMap(to: Apps.self) { teams in
                return App.query(on: req).filter(\App.teamId, in: teams.ids).appFilters().all()
            }
        }
        
        router.get("teams", DbCoreIdentifier.parameter, "apps") { (req) -> Future<Apps> in
            let teamId = try req.parameter(DbCoreIdentifier.self)
            return try req.me.teams().flatMap(to: Apps.self) { teams in
                guard teams.contains(teamId) else {
                    throw ErrorsCore.HTTPError.notFound
                }
                return App.query(on: req).filter(\App.teamId, in: teams.ids).appFilters().all()
            }
        }
        
        router.get("apps", DbCoreIdentifier.parameter) { (req) -> Future<App> in
            let appId = try req.parameter(DbCoreIdentifier.self)
            return try req.me.teams().flatMap(to: App.self) { teams in
                return App.query(on: req).safeApp(appId: appId, teamIds: teams.ids).first().map(to: App.self) { (app) -> App in
                    guard let app = app else {
                        throw ErrorsCore.HTTPError.notFound
                    }
                    return app
                }
            }
        }
        
        /*
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
         // */
        
        router.post("apps") { (req) -> Future<Response> in
            guard let token = try req.http.headers.authorizationToken?.passwordHash(req) else {
                throw ErrorsCore.HTTPError.missingAuthorizationData
            }
            return UploadKey.query(on: req).filter(\.token == token).first().flatMap(to: Response.self) { (uploadToken) -> Future<Response> in
                guard let uploadToken = uploadToken else {
                    throw AuthError.authenticationFailed
                }
                
                return upload(teamId: uploadToken.teamId, on: req)
            }
        }
        
        router.post("teams", DbCoreIdentifier.parameter, "apps") { (req) -> Future<Response> in
            let teamId = try req.parameter(DbCoreIdentifier.self)
            return try req.me.verifiedTeam(id: teamId).flatMap(to: Response.self) { (team) -> Future<Response> in
                return upload(teamId: teamId, on: req)
            }
        }
    }
    
}


extension AppsController {
    
    static func upload(teamId: DbCoreIdentifier, on req: Request) -> Future<Response> {
        return App.query(on: req).first().flatMap(to: Response.self) { (app) -> Future<Response> in
            // TODO: Change to copy file when https://github.com/vapor/core/pull/83 is done
            return req.fileData.flatMap(to: Response.self) { (data) -> Future<Response> in
                // TODO: -------- REFACTOR ---------
                try Boost.tempFileHandler.createFolderStructure(url: App.tempAppFolder(on: req))
                
                let tempFilePath = App.tempAppFile(on: req)
                try data.write(to: tempFilePath)
                
                let output: RunOutput = SwiftShell.run("unzip", "-l", tempFilePath.path)
                
                let platform: App.Platform
                if output.succeeded {
                    print(output.stdout)
                    
                    if output.stdout.contains("Payload/") {
                        platform = .ios
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
                // */ -------- REFACTOR END (or just carry on and make me better!) ---------
                
                let extractor: Extractor = try BaseExtractor.decoder(file: tempFilePath.path, platform: platform, on: req)
                do {
                    let promise: Promise<App> = try extractor.process(teamId: teamId)
                    return promise.future.flatMap(to: Response.self) { (app) -> Future<Response> in
                        return app.save(on: req).flatMap(to: Response.self) { (app) -> Future<Response> in
                            return try extractor.save(app, request: req, Boost.storageFileHandler).flatMap(to: Response.self) { (_) -> Future<Response> in
                                return handleTags(on: req, app: app).flatMap(to: Response.self) { (_) -> Future<Response> in
                                    return try app.asResponse(.created, to: req)
                                }
                            }
                        }
                    }
                } catch {
                    try extractor.cleanUp()
                    throw error
                }
            }
        }
    }
    
    static func handleTags(on req: Request, app: App) -> Future<Void> {
        if let query = try? req.query.decode([String: String].self) {
            if let tags = query["tags"]?.split(separator: "|") {
                var futures: [Future<Void>] = []
                tags.forEach { (tagSubstring) in
                    let tag = String(tagSubstring)
                    let future = Tag.query(on: req).filter(\Tag.identifier == tag).first().flatMap(to: Void.self) { (tagObject) -> Future<Void> in
                        guard let tagObject = tagObject else {
                            let t = Tag(id: nil, name: tag, identifier: tag.safeText)
                            return t.save(on: req).flatMap(to: Void.self, { (tag) -> Future<Void> in
                                return app.tags.attach(tag, on: req).flatten()
                            })
                        }
                        return app.tags.attach(tagObject, on: req).flatten()
                    }
                    futures.append(future)
                }
                return futures.flatten()
            }
        }
        return Future(Void())
    }
    
}
