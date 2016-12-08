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
    
    // MARK: Apps
    
    func index(request: Request) throws -> ResponseRepresentable {
        let s3: S3 = S3(accessKey: "AKIAJ5I3FZOW2UTQJGVA", secretKey: "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")
        let info = try s3.get(infoForFilePath: "liveui.sql", bucketName: "booststore")
        print(info ?? "hu! :)")
        
        return ResponseBuilder.actionFailed

        
        
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
        
        
//        let s3: S3 = S3(accessKey: "AKIAJ5I3FZOW2UTQJGVA", secretKey: "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")
//        let info = try s3.get(infoForFilePath: "liveui.sql", bucketName: "booststore")
//        print(info ?? "hu! :)")
        
        var returnNode = try app!.makeJSON()
        returnNode["build"] = try build.makeJSON()
        return try ResponseBuilder.build(json: returnNode, statusCode: .created)
    }
    
    func delete(request: Request, objectId: IdType) throws -> ResponseRepresentable {
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
