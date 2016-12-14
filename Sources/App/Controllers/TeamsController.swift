//
//  File.swift
//  Boost
//
//  Created by Ondrej Rafaj on 30/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import HTTP


final class TeamsController: RootController, ControllerProtocol {
    
    
    // MARK: Routing
    
    func configureRoutes() {
        self.baseRoute.get("teams", handler: self.index)
        self.baseRoute.post("teams", handler: self.create)
        self.baseRoute.get("teams", IdType.self) { request, objectId in
            return try self.get(request: request, objectId: objectId)
        }
        self.baseRoute.put("teams", IdType.self) { request, objectId in
            return try self.update(request: request, objectId: objectId)
        }
        self.baseRoute.delete("teams", IdType.self) { request, objectId in
            return try self.delete(request: request, objectId: objectId)
        }
    }
    
    // MARK: Teams
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        let data = try Team.query()
        return JSON(try data.all().makeNode())
    }
    
    func get(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard let team = try Team.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        return ResponseBuilder.build(model: team)
    }
    
    func update(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard var team = try Team.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        return try self.updateResponse(request: request, object: &team)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        var team = Team()
        team.created = Date()
        team.adminTeam = false
        return try self.createResponse(request: request, object: &team)
    }
    
    func delete(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard let team = try Team.find(objectId) else {
            return ResponseBuilder.notFound
        }
        guard team.adminTeam == false else {
            return ResponseBuilder.customErrorResponse(statusCode: .forbidden, message: Lang.get("Forbidden"), bodyMessage: Lang.get("Admin team can not be deleted"))
        }
        
        do {
            try team.delete()
        }
        catch {
            return ResponseBuilder.actionFailed
        }
        
        return ResponseBuilder.okNoContent
    }
    
}

// MARK: - Helper methods

extension TeamsController {
    
    func updateResponse(request: Request, object: inout Team) throws -> ResponseRepresentable {
        guard Me.shared.type(min: .admin) else {
            return ResponseBuilder.notAuthorised
        }
        
        let validated: [ValidationError] = request.isCool(forValues: Team.validationFields)
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
    
    func createResponse(request: Request, object: inout Team) throws -> ResponseRepresentable {
        object.created = Date()
        return try self.updateResponse(request: request, object: &object)
    }
    
}
