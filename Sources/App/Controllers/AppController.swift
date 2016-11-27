//
//  AppController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 26/11/2016.
//
//

import Vapor
import HTTP


final class AppController: ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        drop.get("v1", handler: self.index)
        drop.get("v1", "ping", handler: self.ping)
    }
    
    // MARK: Data pages
    
    func index(request: Request) throws -> ResponseRepresentable {
        return JSON([":)"])
    }
    
    func ping(request: Request) throws -> ResponseRepresentable {
        return JSON(["message": "Johnny 5 is alive"])
    }
    
}
