//
//  SettingsController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 26/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP


final class SettingsController: RootController, ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes() {
        let basic = self.baseRoute.grouped("settings")
        basic.get(handler: self.index)
    }
    
    // MARK: Data pages
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        return ":)"
    }
    
}
