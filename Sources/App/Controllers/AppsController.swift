//
//  AppsController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 25/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP


final class AppsController: RootController, ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        let basic = drop.grouped("v1", "apps")
        basic.get(handler: self.index)
        basic.get(IdType.self) { request, appId in
            return try self.view(request: request, appId: appId)
        }
    }
    
    // MARK: Data pages
    
    func index(request: Request) throws -> ResponseRepresentable {
        return ":)"
    }
    
    func view(request: Request, appId: IdType) throws -> ResponseRepresentable {
        return "You requested App #\(appId)"
    }
    
}
