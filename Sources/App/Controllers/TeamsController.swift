//
//  File.swift
//  Boost
//
//  Created by Ondrej Rafaj on 30/11/2016.
//
//

import Vapor
import HTTP


final class TeamsController: RootController, ControllerProtocol {
    
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        let v1 = drop.grouped("v1")
        v1.post("teams", handler: self.index)
        
    }
    
    // MARK: Users
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        let users = try User.query()
        return JSON(try users.all().makeNode())
    }
    
    func update(request: Request, teamId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard Me.shared.type(min: .admin) else {
            return ResponseBuilder.notAuthorised
        }
        
        guard var team = try User.find(teamId) else {
            return ResponseBuilder.notFound
        }
        
        try team.update(fromRequest: request)
        
        do {
            try team.save()
        }
        catch {
            return ResponseBuilder.internalServerError
        }
        
        return ResponseBuilder.build(model: user)
    }
    
    func delete(request: Request, teamId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard Me.shared.type(min: .admin) else {
            return ResponseBuilder.notAuthorised
        }
        
        // TODO: Check is I am the only one in the team or super admin of the team
        let userIdNode = teamId.makeNode()
        if Me.shared.user?.id == userIdNode {
            return ResponseBuilder.selfHarm
        }
        
        guard let team = try Team.find(teamId) else {
            return ResponseBuilder.notFound
        }
        
        if user.type == .superAdmin && !Me.shared.type(min: .superAdmin) {
            return ResponseBuilder.notAuthorised
        }
        
        do {
            try team.delete()
        }
        catch {
            return ResponseBuilder.actionFailed
        }
        
        return ResponseBuilder.okNoContent
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard Me.shared.type(min: .admin) else {
            return ResponseBuilder.notAuthorised
        }
        
        var user = User()
        
        return try self.createUserResponse(request: request, user: &user)
    }
    
}
