//
//  AppController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 26/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP


final class AppController: ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        drop.get("v1", handler: self.root)
        drop.get("v1", "ping", handler: self.ping)
    }
    
    // MARK: Intro
    
    func root(request: Request) throws -> ResponseRepresentable {
        return JSON(["result": "success", "message": "Welcome to Boost Enterprise AppStore API", "documentation": ""])
    }
    
    // MARK: Data pages
    
    func ping(request: Request) throws -> ResponseRepresentable {
        return JSON(["result": "success", "message": "Johnny 5 is alive"])
    }
    
}
