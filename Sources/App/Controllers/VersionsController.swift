//
//  VersionsController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 26/11/2016.
//
//

import Vapor
import HTTP


final class VersionsController: ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        let basic = drop.grouped("v1", "apps")
        basic.get(Int.self, "versions") { request, appId in
            return try self.index(request: request, appId: appId)
        }
        basic.get(Int.self, "versions", Int.self) { request, appId, versionId in
            return try self.viewVersion(request: request, appId: appId, versionId: versionId)
        }
    }
    
    // MARK: Data pages
    
    func index(request: Request, appId: Int) throws -> ResponseRepresentable {
        return JSON([":)"])
    }
    
    func viewVersion(request: Request, appId: Int, versionId: Int) throws -> ResponseRepresentable {
        return "You requested App #\(appId) Version #\(versionId)"
    }
    
}
