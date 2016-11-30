//
//  VersionsController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 26/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP


final class VersionsController: RootController, ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        let basic = drop.grouped("v1", "apps")
        basic.get(IdType.self, "versions") { request, appId in
            return try self.index(request: request, appId: appId)
        }
        basic.get(IdType.self, "versions", IdType.self) { request, appId, versionId in
            return try self.viewVersion(request: request, appId: appId, versionId: versionId)
        }
    }
    
    // MARK: Data pages
    
    func index(request: Request, appId: IdType) throws -> ResponseRepresentable {
        return ":)"
    }
    
    func viewVersion(request: Request, appId: IdType, versionId: IdType) throws -> ResponseRepresentable {
        return "You requested App #\(appId) Version #\(versionId)"
    }
    
}
