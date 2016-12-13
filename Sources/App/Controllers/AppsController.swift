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


final class AppsController: RootController, ControllerProtocol {
    
    
    
    
    // MARK: Routing
    
    func configureRoutes() {
        self.baseRoute.get("apps", handler: self.index)
        self.baseRoute.post("apps", handler: self.upload)
        self.baseRoute.get("apps", IdType.self) { request, objectId in
            return try self.get(request: request, objectId: objectId)
        }
        self.baseRoute.put("apps", IdType.self) { request, objectId in
            return try self.update(request: request, objectId: objectId)
        }
        self.baseRoute.delete("apps", IdType.self) { request, objectId in
            return try self.delete(request: request, objectId: objectId)
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
        
        let data = try App.query()
        return JSON(try data.all().makeNode())
    }
    
    func get(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard let object = try App.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        return ResponseBuilder.build(model: object)
    }
    
    func update(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard var object = try App.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        return try self.updateResponse(request: request, object: &object)
    }
    
    func upload(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard let multipart: Multipart = request.multipart?["app"] else {
            return ResponseBuilder.incompleteData
        }
        
        let decoder: DecoderProtocol = Decoder.decoderForFile(multipart: multipart)
        try decoder.prepare()
        try decoder.parse()
        
        var app: App? = try App.find(identifier: decoder.appIdentifier!, platform: decoder.platform!)
        if app == nil {
            app = App()
            app?.identifier = decoder.appIdentifier
            app?.platform = decoder.platform
            app?.token = UUID().uuidString
            app?.created = Date()
        }
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
        
        let s3: S3 = try self.s3()
        let path: String = "data/" + app!.platform!.rawValue + "/" + app!.id!.string! + "/" + build.id!.string!
        if let iconData: Data = decoder.iconData {
            try s3.put(data: iconData, filePath: (path + "/icon.png"), bucketName: "booststore", accessControl: .publicRead)
        }
        try s3.put(bytes: (multipart.file?.data)!, filePath: (path + "/app.data"), bucketName: "booststore", accessControl: .publicRead)
        
        try decoder.cleanUp()
    
        let ret: [String: Node] = try ["app": app!.makeNode(), "build": build.makeNode()]
        return try ResponseBuilder.build(node: ret.makeNode(), statusCode: .created)
    }
    
    func delete(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        let s3: S3 = try self.s3()
        try s3.delete(fileAtPath: "photo.JPG", bucketName: "booststore")
        
        
        if let response = super.kickOut(request) {
            return response
        }
        
        guard let object = try App.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        do {
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
    
    func updateResponse(request: Request, object: inout App) throws -> ResponseRepresentable {
        guard Me.shared.type(min: .admin) else {
            return ResponseBuilder.notAuthorised
        }
        
        let validated: [ValidationError] = request.isCool(forValues: App.validationFields)
        if validated.count == 0 {
            try object.update(fromRequest: request)
            
            do {
                try object.save()
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
    
    func createResponse(request: Request, object: inout App) throws -> ResponseRepresentable {
        object.created = Date()
        return try self.updateResponse(request: request, object: &object)
    }
    
}
