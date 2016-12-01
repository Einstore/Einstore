//
//  CompaniesController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import HTTP


final class CompaniesController: RootController, ControllerProtocol {
    
    
    // MARK: Routing
    
    func configureRoutes() {
        self.baseRoute.get("companies", handler: self.index)
        self.baseRoute.post("companies", handler: self.create)
        self.baseRoute.get("companies", IdType.self) { request, objectId in
            return try self.get(request: request, objectId: objectId)
        }
        self.baseRoute.put("companies", IdType.self) { request, objectId in
            return try self.update(request: request, objectId: objectId)
        }
        self.baseRoute.delete("companies", IdType.self) { request, objectId in
            return try self.delete(request: request, objectId: objectId)
        }
    }
    
    // MARK: Companies
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        let data = try Company.query()
        return JSON(try data.all().makeNode())
    }
    
    func get(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard let object = try Company.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        return ResponseBuilder.build(model: object)
    }
    
    func update(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard var object = try Company.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        return try self.updateResponse(request: request, object: &object)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        var object = Company()
        object.created = Date()
        return try self.createResponse(request: request, object: &object)
    }
    
    func delete(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard let object = try Company.find(objectId) else {
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

extension CompaniesController {
    
    func updateResponse(request: Request, object: inout Company) throws -> ResponseRepresentable {
        guard Me.shared.type(min: .admin) else {
            return ResponseBuilder.notAuthorised
        }
        
        let validated: [ValidationError] = request.isCool(forValues: Company.validationFields)
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
    
    func createResponse(request: Request, object: inout Company) throws -> ResponseRepresentable {
        object.created = Date()
        return try self.updateResponse(request: request, object: &object)
    }
    
}
