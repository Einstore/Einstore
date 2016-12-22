//
//  UsersController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 24/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import HTTP


final class UsersController: RootController, ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes() {
        self.baseRoute.post("auth", handler: self.auth)
        
        let basic = self.baseRoute.grouped("users")
        
        // Users
        basic.get("logout", handler: self.logout)
        basic.post("register", handler: self.register)
        basic.get(handler: self.index)
        basic.post("invite", handler: self.invite)
        basic.post(handler: self.create)
        basic.get(IdType.self) { request, appId in
            return try self.view(request: request, userId: appId)
        }
        basic.put(IdType.self) { request, appId in
            return try self.update(request: request, userId: appId)
        }
        basic.delete(IdType.self) { request, appId in
            return try self.delete(request: request, userId: appId)
        }
        basic.get("types", handler: self.userTypes)
        basic.get("types", "full", handler: self.userTypesFull)
        
        // Parent & children
        basic.get(IdType.self, "teams") { request, userId in
            return try self.teams(request: request, userId: userId)
        }
    }
    
    // MARK: Authentication
    
    private func login(email: String, password: String, hashPassword: Bool = true) throws -> Auth? {
        var pass: String
        if !hashPassword {
            pass = password
        }
        else {
            pass = try drop.hash.make(password)
        }
        
        guard let user: User = try User.find(email: email, password: pass) else {
            return nil
        }
        
        try Auth.delete(userId: user.id!)
        var auth = Auth(user: user)
        try auth.save()
        
        return auth
    }
    
    func auth(request: Request) throws -> ResponseRepresentable {
        guard let email = request.data["email"]?.string else {
            return ResponseBuilder.notAuthorised
        }
        guard let password = request.data["password"]?.string else {
            return ResponseBuilder.notAuthorised
        }
        
        guard let auth = try self.login(email: email, password: password) else {
            return ResponseBuilder.notAuthorised
        }
        
        do {
            let json: JSON = try auth.makeJSON()
            return ResponseBuilder.build(json: json)
        }
        catch {
            return ResponseBuilder.notAuthorised
        }
    }
    
    func logout(request: Request) throws -> ResponseRepresentable {
        let hashedToken = try drop.hash.make(request.authTokenString ?? "")
        try Auth.delete(token: hashedToken)
        return ResponseBuilder.okNoContent
    }
    
    func register(request: Request) throws -> ResponseRepresentable {
        var user = User()
        try user.update(fromRequest: request)
        
        // TODO: Set to tester only if the user hasn't been invited
        user.type = .tester
        
        return try self.createUserResponse(request: request, user: &user)
    }
    
    // MARK: Users
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard Me.shared.type(min: .developer) else {
            return ResponseBuilder.notAuthorised
        }
        
        let users = try User.query()
        return JSON(try users.all().makeNode())
    }
    
    func view(request: Request, userId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        guard Me.shared.type(min: .developer) else {
            return ResponseBuilder.notAuthorised
        }

        guard let user = try User.find(userId) else {
            return ResponseBuilder.notFound
        }
        return ResponseBuilder.build(model: user)
    }
    
    func update(request: Request, userId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        let me: User? = Me.shared.user
        let userIdNode = userId.makeNode()
        
        guard Me.shared.type(min: .admin) || me?.id == userIdNode else {
            return ResponseBuilder.notAuthorised
        }
        
        guard var user = try User.find(userId) else {
            return ResponseBuilder.notFound
        }
        
        // TODO: Check if new email exists
        try user.update(fromRequest: request)
        
        do {
            try user.save()
        }
        catch {
            return ResponseBuilder.internalServerError
        }
        
        return ResponseBuilder.build(model: user)
    }
    
    func delete(request: Request, userId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        let userIdNode = userId.makeNode()
        if Me.shared.user?.id == userIdNode {
            return ResponseBuilder.selfHarm
        }
        
        guard let user = try User.find(userId) else {
            return ResponseBuilder.notFound
        }
        
        if user.type == .superAdmin && !Me.shared.type(min: .superAdmin) {
            return ResponseBuilder.notAuthorised
        }
        
        do {
            try Auth.delete(userId: user.id!)
            try user.delete()
        }
        catch {
            return ResponseBuilder.actionFailed
        }
        
        return ResponseBuilder.okNoContent
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        var user = User()
        
        return try self.createUserResponse(request: request, user: &user)
    }
    
    func invite(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        var user = User()
        
        user.token = UUID().uuidString
        
        return try self.createUserResponse(request: request, user: &user, validationFields: User.inviteValidationFields, forgetPassword: true)
    }
    
    func userTypes(request: Request) throws -> ResponseRepresentable {
        let types: [String] = [UserType.superAdmin.rawValue, UserType.admin.rawValue, UserType.developer.rawValue, UserType.tester.rawValue]
        return ResponseBuilder.build(node: try types.makeNode())
    }
    
    func userTypesFull(request: Request) throws -> ResponseRepresentable {
        let types: [String: String] = [UserType.superAdmin.rawValue: Lang.get("SuperAdmin"), UserType.admin.rawValue: Lang.get("Admin"), UserType.developer.rawValue: Lang.get("Developer"), UserType.tester.rawValue: Lang.get("Tester")]
        return ResponseBuilder.build(node: try types.makeNode())
    }
    
    func teams(request: Request, userId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        if userId != Me.shared.id()?.string {
            guard Me.shared.type(min: .developer) else {
                return ResponseBuilder.notAuthorised
            }
        }
        
        guard let user = try User.find(userId) else {
            return ResponseBuilder.notFound
        }
        
        let teams = try user.teams().requestSorted(request, sortBy: "name", direction: .ascending)
        return JSON(try teams.makeNode())
    }
    
}

// MARK: - Helper methods

extension UsersController {
    
    func createUserResponse(request: Request, user: inout User, validationFields: [Field] = User.validationFields, forgetPassword: Bool = false) throws -> ResponseRepresentable {
        let validated: [ValidationError] = request.isCool(forValues: validationFields)
        if validated.count == 0 {
            user.created = Date()
            try user.update(fromRequest: request, forgetPassword: forgetPassword)
            
            if let _ = try User.find(email: user.email!) {
                return ResponseBuilder.emailExists
            }
            
            do {
                try user.save()
            }
            catch {
                return ResponseBuilder.internalServerError
            }
            
            return ResponseBuilder.build(model: user, statusCode: StatusCodes.created)
        }
        else {
            return ResponseBuilder.validationErrorResponse(errors: validated)
        }
    }
    
    func createUserResponse(request: Request, user: inout User, forgetPassword: Bool) throws -> ResponseRepresentable {
        return try self.createUserResponse(request: request, user: &user, validationFields: User.validationFields, forgetPassword: forgetPassword)
    }
    
}
