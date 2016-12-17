//
//  UploadTokensController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 09/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import HTTP


final class UploadTokensController: RootController, ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes() {
        let group = self.baseRoute.grouped("tokens")
        
        group.get(handler: self.index)
        group.post() { request in
            return try self.create(request: request)
        }
        group.put(IdType.self) { request, objectId in
            return try self.put(request: request, objectId: objectId)
        }
        group.delete(IdType.self) { request, objectId in
            return try self.delete(request: request, objectId: objectId)
        }
    }
    
    // MARK: Data pages
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        let query = try UploadToken.query()
        let data = try query.sort("name", .ascending).all()
        var output: [JSON] = []
        for item in data {
            try output.append(item.makeJSON())
        }
        return JSON(try output.makeNode())
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        var token = UploadToken()
        try token.update(fromRequest: request)
        if token.name == nil || token.name == "" {
            let formatter: DateFormatter = DateFormatter()
            formatter.dateStyle = .short
            formatter.timeStyle = .medium
            token.name = formatter.string(from: Date())
        }
        let guid: String = UUID().uuidString
        token.token = try drop.hash.make(guid)
        token.created = Date()
        
        let validated: [ValidationError] = request.isCool(forValues: UploadToken.validationFields)
        if validated.count == 0 {
            do {
                try token.save()
            }
            catch {
                return ResponseBuilder.internalServerError
            }
        }
        else {
            return ResponseBuilder.validationErrorResponse(errors: validated)
        }
        
        token.token = guid
        return JSON(try token.makeNode())
    }
    
    func put(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        guard var token = try UploadToken.find(objectId.makeNode()) else {
            return ResponseBuilder.notFound
        }
        
        try token.update(fromRequest: request)
        if token.name == nil || token.name == "" {
            let formatter: DateFormatter = DateFormatter()
            formatter.dateStyle = .short
            formatter.timeStyle = .medium
            token.name = formatter.string(from: token.created!)
        }
        
        let validated: [ValidationError] = request.isCool(forValues: UploadToken.validationFields)
        if validated.count == 0 {
            do {
                try token.save()
            }
            catch {
                return ResponseBuilder.internalServerError
            }
        }
        else {
            return ResponseBuilder.validationErrorResponse(errors: validated)
        }
        
        return try token.makeJSON()
    }
    
    func delete(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        guard let token = try UploadToken.find(objectId.makeNode()) else {
            return ResponseBuilder.notFound
        }
        
        do {
            try token.delete()
        }
        catch {
            return ResponseBuilder.internalServerError
        }
        
        return ResponseBuilder.okNoContent
    }
    
}
