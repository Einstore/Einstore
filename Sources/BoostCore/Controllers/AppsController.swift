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
    
    func safeApp(appId: DbCoreIdentifier, teamIds: [DbCoreIdentifier]) throws -> Self {
        return try group(.and) { and in
            try and.filter(\App.id == appId)
            try and.filter(\App.teamId, in: teamIds)
        }
    }
    
}


class AppsController: Controller {
    
    enum AppsError: FrontendError {
        case invalidPlatform
        
        var code: String {
            return "app_error"
        }
        
        var description: String {
            return "Unsupported platform"
        }
        
        var status: HTTPStatus {
            return .conflict
        }
        
    }
    
    static func boot(router: Router) throws {
        // Overview
        router.get("apps") { (req) -> Future<Apps> in
            return try req.me.teams().flatMap(to: Apps.self) { teams in
                return try App.query(on: req).filter(\App.teamId, in: teams.ids).appFilters().all()
            }
        }
        
        router.get("teams", DbCoreIdentifier.parameter, "apps") { (req) -> Future<Apps> in
            let teamId = try req.parameter(DbCoreIdentifier.self)
            return try req.me.teams().flatMap(to: Apps.self) { teams in
                guard teams.contains(teamId) else {
                    throw ErrorsCore.HTTPError.notFound
                }
                return try App.query(on: req).filter(\App.teamId, in: teams.ids).appFilters().all()
            }
        }
        
        router.get("apps", DbCoreIdentifier.parameter) { (req) -> Future<App> in
            let appId = try req.parameter(DbCoreIdentifier.self)
            return try req.me.teams().flatMap(to: App.self) { teams in
                return try App.query(on: req).safeApp(appId: appId, teamIds: teams.ids).first().map(to: App.self) { app in
                    guard let app = app else {
                        throw ErrorsCore.HTTPError.notFound
                    }
                    return app
                }
            }
        }
        
        router.get("apps", DbCoreIdentifier.parameter, "auth") { (req) -> Future<Response> in
            let appId = try req.parameter(DbCoreIdentifier.self)
            return try req.me.teams().flatMap(to: Response.self) { teams in
                return try App.query(on: req).safeApp(appId: appId, teamIds: teams.ids).first().flatMap(to: Response.self) { app in
                    guard let app = app, let appId = app.id else {
                        throw ErrorsCore.HTTPError.notFound
                    }
                    let key = DownloadKey(appId: appId)
                    let originalToken: String = key.token
                    key.token = try key.token.passwordHash(req)
                    return key.save(on: req).flatMap(to: Response.self) { key in
                        return try DownloadKey.query(on: req).filter(\DownloadKey.added < Date().addMinute(n: -15)).delete().flatMap(to: Response.self) { _ in
                            key.token = originalToken
                            return try DownloadKey.Public(downloadKey: key, request: req).asResponse(.ok, to: req)
                        }
                    }
                }
            }
        }
        
        router.get("apps", "plist") { (req) -> Future<Response> in
            let token = try req.query.decode(DownloadKey.Token.self)
            return try DownloadKey.query(on: req).filter(\DownloadKey.token == token.token).filter(\DownloadKey.added >= Date().addMinute(n: -15)).first().flatMap(to: Response.self) { key in
                guard let key = key else {
                    return try DownloadKey.query(on: req).filter(\DownloadKey.added < Date().addMinute(n: -15)).delete().map(to: Response.self) { _ in
                        throw ErrorsCore.HTTPError.notAuthorized
                    }
                }
                return try App.query(on: req).filter(\App.id == key.appId).first().map(to: Response.self) { app in
                    guard let app = app else {
                        throw ErrorsCore.HTTPError.notFound
                    }
                    guard app.platform == .ios else {
                        throw AppsError.invalidPlatform
                    }
                    let response = try req.response.basic(status: .ok)
                    response.http.headers = HTTPHeaders([("Content-Type", "application/xml; charset=utf-8")])
                    response.http.body = try HTTPBody(data: AppPlist(app: app, request: req).asPropertyList())
                    return response
                }
            }
        }
        
        router.get("apps", "file") { (req) -> Future<Response> in
            let token = try req.query.decode(DownloadKey.Token.self)
            return try DownloadKey.query(on: req).filter(\DownloadKey.token == token.token).filter(\DownloadKey.added >= Date().addMinute(n: -15)).first().flatMap(to: Response.self) { key in
                guard let key = key else {
                    return try DownloadKey.query(on: req).filter(\DownloadKey.added < Date().addMinute(n: -15)).delete().map(to: Response.self) { _ in
                        throw ErrorsCore.HTTPError.notAuthorized
                    }
                }
                return try App.query(on: req).filter(\App.id == key.appId).first().map(to: Response.self) { app in
                    guard let app = app else {
                        throw ErrorsCore.HTTPError.notFound
                    }
                    guard app.platform == .ios else {
                        throw AppsError.invalidPlatform
                    }
//                    let response = try req.streamFile(at: app.appPath!.path)
                    let response = try req.response.basic(status: .ok)
                    response.http.headers = HTTPHeaders([("Content-Type", "\(app.platform.mime)"), ("Content-Disposition", "attachment; filename=\"\(app.name.safeText).\(app.platform.fileExtension)\"")])
                    let appData = try Data(contentsOf: app.appPath!, options: [])
                    response.http.body = HTTPBody(data: appData)
                    return response
                }
            }
        }
        
        router.get("apps", DbCoreIdentifier.parameter, "tags") { (req) -> Future<Tags> in
            let appId = try req.parameter(DbCoreIdentifier.self)
            return try req.me.teams().flatMap(to: Tags.self) { teams in
                return try App.query(on: req).safeApp(appId: appId, teamIds: teams.ids).first().flatMap(to: Tags.self) { app in
                    guard let app = app else {
                        throw ErrorsCore.HTTPError.notFound
                    }
                    return try app.tags.query(on: req).all()
                }
            }
        }
        
        router.delete("apps", DbCoreIdentifier.parameter) { (req) -> Future<Response> in
            let appId = try req.parameter(DbCoreIdentifier.self)
            return try req.me.teams().flatMap(to: Response.self) { teams in
                return try App.query(on: req).safeApp(appId: appId, teamIds: teams.ids).first().flatMap(to: Response.self) { app in
                    guard let app = app else {
                        throw ErrorsCore.HTTPError.notFound
                    }
                    return try app.tags.query(on: req).all().flatMap(to: Response.self) { tags in
                        var futures: [Future<Void>] = []
                        
                        // Delete all tags
                        try tags.forEach({ tag in
                            let tagFuture = try tag.apps.query(on: req).count().flatMap(to: Void.self) { count in
                                if count <= 1 {
                                    return tag.delete(on: req).flatten()
                                }
                                else {
                                    return app.tags.detach(tag, on: req).flatten()
                                }
                            }
                            futures.append(tagFuture)
                        })
                        
                        // Delete app
                        futures.append(app.delete(on: req).flatten())
                        
                        // Delete all files
                        guard let path = app.targetFolderPath else {
                            return try req.eventLoop.newSucceededFuture(result: req.response.internalServerError(message: "Unable to delete files"))
                        }
                        let deleteFuture = try Boost.storageFileHandler.delete(url: path, on: req)
                        futures.append(deleteFuture)
                        
                        return try futures.flatten(on: req).asResponse(to: req)
                    }
                }
            }
        }
        
        router.post("apps") { (req) -> Future<Response> in
            guard let token = try? req.query.decode(UploadKey.Token.self) else {
                throw ErrorsCore.HTTPError.missingAuthorizationData
            }
            return try UploadKey.query(on: req).filter(\.token == token.token).first().flatMap(to: Response.self) { (uploadToken) -> Future<Response> in
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
                    return promise.futureResult.flatMap(to: Response.self) { (app) -> Future<Response> in
                        return app.save(on: req).flatMap(to: Response.self) { (app) -> Future<Response> in
                            return try extractor.save(app, request: req, Boost.storageFileHandler).flatMap(to: Response.self) { (_) -> Future<Response> in
                                return try handleTags(on: req, app: app).flatMap(to: Response.self) { (_) -> Future<Response> in
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
    
    static func handleTags(on req: Request, app: App) throws -> Future<Void> {
        if let query = try? req.query.decode([String: String].self) {
            if let tags = query["tags"]?.split(separator: "|") {
                var futures: [Future<Void>] = []
                try tags.forEach { (tagSubstring) in
                    let tag = String(tagSubstring)
                    let future = try Tag.query(on: req).filter(\Tag.identifier == tag).first().flatMap(to: Void.self) { (tagObject) -> Future<Void> in
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
                return futures.flatten(on: req)
            }
        }
        let future: Future<Void> =  req.eventLoop.newSucceededFuture(result: Void())
        return future
    }
    
}
