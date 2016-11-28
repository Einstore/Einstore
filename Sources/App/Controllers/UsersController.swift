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


final class UsersController: ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        let v1 = drop.grouped("v1")
        v1.post("auth", handler: self.auth)
        v1.get("logout", handler: self.logout)
        
        let basic = v1.grouped("users")
        basic.get(handler: self.index)
        basic.get(Int.self) { request, appId in
            return try self.view(request: request, appId: appId)
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
        
        guard let user: User = try User.query().filter("email", email).filter("password", pass).first() else {
            return nil
        }
        
        var auth: Auth? = try Auth.query().filter("user", user).first()
        if auth == nil {
            auth = Auth(user: user)
        }
        try auth!.save()
        
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
            auth.id = nil
            let authNode: Node = try auth.makeNode()
            return JSON(authNode)
        }
        catch {
            let response = Response(status: .other(statusCode: 500, reasonPhrase: "Login failure"))
            return response
        }
    }
    
    func logout(request: Request) throws -> ResponseRepresentable {
        // TODO: Kill active token
        return Responses.okNoContent
    }
    
    func register(request: Request) throws -> ResponseRepresentable {
        var user = User()
        user.email = "rafaj@mangoweb.cz"
        try user.save()
        return user
    }
    
    // MARK: Users
    
    func index(request: Request) throws -> ResponseRepresentable {
        return JSON([":)"])
    }
    
    func view(request: Request, appId: Int) throws -> ResponseRepresentable {
        return "You requested App #\(appId)"
    }

    
}
