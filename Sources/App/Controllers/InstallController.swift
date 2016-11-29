//
//  InstallController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP


final class InstallController: RootController, ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        drop.get("v1", "install", handler: self.index)
    }
    
    // MARK: Data pages
    
    func index(request: Request) throws -> ResponseRepresentable {
        // TODO: Install basic user and any other database stuff
        // TODO: Install should be only available if there is no SU available
        
        let superUsers = try User.query().filter("type", "su")
        
        if try superUsers.all().count == 0 {
            var user = User()
            user.email = "admin@boost"
            user.type = .superAdmin
            user.firstname = "Super"
            user.lastname = "Admin"
            user.company = nil
            user.password = try drop.hash.make("password")
            user.phone = nil
            user.timezone = 0
            
            do {
                try user.save()
                
                return JSON(["result": "success", "user": try user.makeNode()])
            }
            catch {
                return JSON(["result": "failure"])
            }
        }
        else {
            return JSON(["error": "Install is locked"])
        }
    }
    
}
