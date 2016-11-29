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
    
    func configureRoutes(_ drop: Droplet) {
        let v1 = drop.grouped("v1")
        v1.post("auth", handler: self.auth)
        v1.get("logout", handler: self.logout)
        v1.post("register", handler: self.register)
        
        let basic = v1.grouped("users")
        basic.get(handler: self.index)
        basic.post(handler: self.create)
        basic.get(String.self) { request, appId in
            return try self.view(request: request, userId: appId)
        }
        basic.put(String.self) { request, appId in
            return try self.update(request: request, userId: appId)
        }
        basic.get("types", handler: self.userTypes)
        basic.get("types", "full", handler: self.userTypesFull)
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
        
        guard let user: User = try User.getOne(email: email, password: pass) else {
            return nil
        }
        
        try Auth.delete(userId: user.id!)
        var auth = Auth(user: user)
        try auth.save()
        
        return auth
    }
    
    func auth(request: Request) throws -> ResponseRepresentable {
        guard let email = request.data["email"]?.string else {
            return Responses.invalidAuthentication
        }
        guard let password = request.data["password"]?.string else {
            return Responses.invalidAuthentication
        }
        
        guard let auth = try self.login(email: email, password: password) else {
            return Responses.invalidAuthentication
        }
        
        do {
            return try auth.makeJSON()
        }
        catch {
            let response = Response(status: .other(statusCode: 500, reasonPhrase: "Login failure"))
            return response
        }
    }
    
    func logout(request: Request) throws -> ResponseRepresentable {
        let hashedToken = try drop.hash.make(request.tokenString ?? "")
        try Auth.delete(token: hashedToken)
        return Responses.okNoContent
    }
    
    func register(request: Request) throws -> ResponseRepresentable {
        var user = User()
        try user.update(fromRequest: request)
        // TODO: Set to tester only if the user hasn't been invited
        user.type = .tester
        // TODO: Validate user
        try user.save()
        return user
    }
    
    // MARK: Users
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        // TODO: Select only users I can see
        let users = try User.query()
        return JSON(try users.all().makeNode())
    }
    
    func view(request: Request, userId: String) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        guard let user = try User.getOne(idString: userId) else {
            return Responses.notFound
        }
        return user
    }
    
    func update(request: Request, userId: String) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        let me: User? = Me.shared.user
        guard me?.type == .admin || me?.type == .superAdmin || me?.id?.string == userId else {
            return Responses.notAuthorised
        }
        
        guard var user = try User.getOne(idString: userId) else {
            return Responses.notFound
        }
        
        try user.update(fromRequest: request)
        
        do {
            try user.save()
        }
        catch {
            print(error)
        }
        
        return user
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        let me: User? = Me.shared.user
        guard me?.type == .admin || me?.type == .superAdmin else {
            return Responses.notAuthorised
        }
        
        var user = User()
        try user.update(fromRequest: request)
        // TODO: Validate user
        try user.save()
        try user.save()
        
        return user
    }
    
    func userTypes(request: Request) throws -> ResponseRepresentable {
        let types: [String] = [UserType.superAdmin.rawValue, UserType.admin.rawValue, UserType.developer.rawValue, UserType.tester.rawValue]
        return JSON(try types.makeNode())
    }
    
    func userTypesFull(request: Request) throws -> ResponseRepresentable {
        let types: [String: String] = [UserType.superAdmin.rawValue: "SuperAdmin", UserType.admin.rawValue: "Admin", UserType.developer.rawValue: "Developer", UserType.tester.rawValue: "Tester"]
        return JSON(try types.makeNode())
    }
    
    
}
