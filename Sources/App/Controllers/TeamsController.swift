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
    
}
