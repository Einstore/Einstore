//
//  AppsController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 25/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import HTTP
import S3
import Routing


final class AppsController: RootController, ControllerProtocol {
    
    
    // MARK: Routing
    
    func configureRoutes() {
        let appGroup: Routing.RouteGroup = self.baseRoute.grouped("apps")
        
        // Apps
        appGroup.get(handler: self.index)
        appGroup.post(handler: self.upload)
        appGroup.get(IdType.self) { request, objectId in
            return try self.get(request: request, objectId: objectId)
        }
        appGroup.put(IdType.self) { request, objectId in
            return try self.update(request: request, objectId: objectId)
        }
        appGroup.delete(IdType.self) { request, objectId in
            return try self.delete(request: request, objectId: objectId)
        }
        
        // Builds
        self.baseRoute.get("builds", IdType.self) { request, objectId in
            return try self.build(request: request, objectId: objectId)
        }
        self.baseRoute.delete("builds", IdType.self) { request, objectId in
            return try self.deleteBuild(request: request, objectId: objectId)
        }
        
        // Builds in apps
        appGroup.get(IdType.self, "builds") { request, objectId in
            return try self.builds(request: request, objectId: objectId)
        }
        appGroup.get(IdType.self, "builds", IdType.self) { request, objectId, buildId in
            return try self.build(request: request, objectId: buildId)
        }
        appGroup.delete(IdType.self, "builds", IdType.self) { request, objectId, buildId in
            return try self.deleteBuild(request: request, objectId: buildId)
        }
    }
    
    // MARK: S3
    
    private func s3() throws -> S3 {
        let s3: S3 = try S3(droplet: drop)
        return s3
    }
    
    // MARK: Apps
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        // BOOST: Only return builds user can see if they are < developer
        
        let data = try App.query()
        return JSON(try data.requestSorted(request).makeNode())
    }
    
    func get(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        // BOOST: Only return builds user can see if they are < developer
        
        guard let object = try App.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        return ResponseBuilder.build(model: object)
    }
    
    func build(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        // BOOST: Only return builds user can see if they are < developer
        
        guard let object = try Build.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        return ResponseBuilder.build(model: object)
    }
    
    func deleteBuild(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request, minAccess: .developer) {
            return response
        }
        
        guard let object = try Build.find(objectId) else {
            return ResponseBuilder.notFound
        }
        guard let app = try App.find(object.app!.makeNode()) else {
            return ResponseBuilder.appNotFound
        }
        
        // BOOST: Check build is being deleted!
        let s3: S3 = try self.s3()
        
        // Path format: data/:appPlatform/:appId/:buildId
        guard let appId: String = app.id?.string else {
            // TODO: Improve error
            return ResponseBuilder.internalServerError
        }
        guard let objectId: String = object.id?.string else {
            // TODO: Improve error
            return ResponseBuilder.internalServerError
        }
        guard let platform: String = app.platform?.rawValue else {
            // TODO: Improve error
            return ResponseBuilder.internalServerError
        }
        let path: String = "data/\(platform)/\(appId)/\(objectId)"
        try s3.delete(fileAtPath: path)
        
        // History
        try History.make(.deleteBuild, objectId: object.app?.makeNode())
        
        return ResponseBuilder.build(model: object)
    }
    
    func builds(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        // BOOST: Only return builds user can see if they are < developer
        
        guard let object = try App.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        let builds: [Build] = try Build.query().filter("app", object.id!).requestSorted(request, sortBy: "created", direction: .descending)
        return ResponseBuilder.build(node: try builds.makeNode())
    }
    
    func update(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request, minAccess: .developer) {
            return response
        }
        
        guard var object = try App.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        let validated: [ValidationError] = request.isCool(forValues: App.validationFields)
        if validated.count == 0 {
            try object.update(fromRequest: request)
            
            object.modified = Date()
            
            do {
                try object.save()
                
                // History
                try History.make(.updateApp, objectId: object.id)
            }
            catch {
                return ResponseBuilder.internalServerError
            }
            
            return ResponseBuilder.build(model: object, statusCode: StatusCodes.created)
        }
        else {
            return ResponseBuilder.validationErrorResponse(errors: validated)
        }
    }
    
    func upload(request: Request) throws -> ResponseRepresentable {
        if let token: String = request.uploadTokenString {
            guard try UploadToken.exists(token: token) else {
                return ResponseBuilder.notAuthorised
            }
        }
        else {
            if let response = super.basicAuth(request, minAccess: .developer) {
                return response
            }
        }
        
        // BOOST: Upload as a binary file!!!!
        guard let multipart: Multipart = request.multipart?["app"] else {
            return ResponseBuilder.incompleteData
        }
        
        // BOOST: Unzip first and than decide which decoder to use based on content
        guard let decoder: DecoderProtocol = Decoder.decoderForFile(multipart: multipart) else {
            throw BoostError(.fileNotCompatible)
        }
        try decoder.prepare()
        try decoder.parse()
        
        // BOOST: Return JSON errors
        guard let platform: Platform = decoder.platform else {
            throw BoostError(.missingPlatform)
        }
        guard let identifier: String = decoder.appIdentifier else {
            throw BoostError(.missingIdentifier)
        }
        
        var app: App? = try App.find(identifier: identifier, platform: platform)
        if app == nil {
            app = App()
            app?.identifier = decoder.appIdentifier
            app?.platform = platform
            app?.created = Date()
        }
        app?.modified = Date()
        app?.latest = Date()
        
        app?.name = decoder.appName
        try app?.save()
        
        guard let appId: String = app?.id?.string else {
            return ResponseBuilder.actionFailed
        }
        
        let data: JSON = try decoder.toJSON()
        
        var build: Build = Build()
        build.name = decoder.appName
        build.created = Date()
        build.data = data
        build.app = appId
        
        try build.save()
        
        guard app!.id != nil && build.id != nil else {
            throw BoostError(.databaseError)
        }
        
        let s3: S3 = try self.s3()
        let path: String = "data/" + decoder.platform!.rawValue + "/" + app!.id!.string! + "/" + build.id!.string!
        if let iconData: Data = decoder.iconData {
            try s3.put(data: iconData, filePath: (path + "/icon.png"), accessControl: .publicRead)
        }
        try s3.put(bytes: (multipart.file?.data)!, filePath: (path + "/app.data"), accessControl: .publicRead)
        
        try decoder.cleanUp()
        
        let ret: [String: Node] = try ["app": app!.makeNode(), "build": build.makeNode()]
        
        // History
        try History.make(.uploadApp, objectId: app?.id)
        
        return try ResponseBuilder.build(node: ret.makeNode(), statusCode: .created)
    }
    
    func delete(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request, minAccess: .developer) {
            return response
        }
        
        guard let object = try App.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        do {
            // BOOST: Make sure that the following actually does delete builds! Super important!
            try object.builds().delete()
            
            let s3: S3 = try self.s3()
            let path: String = "data/" + object.platform!.rawValue + "/" + object.id!.string!
            try s3.delete(fileAtPath: path)
            
            // History
            try History.make(.deleteApp, message: "\((object.name ?? "Unknown name")) (\((object.identifier ?? "Unknown identifier")))")
            
            try object.delete()
        }
        catch {
            return ResponseBuilder.actionFailed
        }
        
        return ResponseBuilder.okNoContent
    }
    
}

// MARK: - Helper methods

extension AppsController {
    
}
