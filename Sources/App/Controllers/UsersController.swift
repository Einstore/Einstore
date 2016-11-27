//
//  UsersController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 24/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP


final class UsersController: ControllerProtocol, ResourceRepresentable {
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        let v1 = drop.grouped("v1")
        v1.get(handler: self.root)
        
        let basic = v1.grouped("users")
        basic.get(handler: self.index)
        basic.get(Int.self) { request, appId in
            return try self.view(request: request, appId: appId)
        }
    }
    
    // MARK: Data pages
    
    func root(request: Request) throws -> ResponseRepresentable {
        return JSON(["Message": "Welcome to Boost Enterprise AppStore API", "documentation": ""])
    }
    
    func index(request: Request) throws -> ResponseRepresentable {
        return JSON([":)"])
    }
    
    func view(request: Request, appId: Int) throws -> ResponseRepresentable {
        return "You requested App #\(appId)"
    }

    
}
