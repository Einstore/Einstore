//
//  SettingsController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 26/11/2016.
//
//

import Vapor
import HTTP


final class SettingsController: ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        let basic = drop.grouped("v1", "settings")
        basic.get(handler: self.index)
    }
    
    // MARK: Data pages
    
    func index(request: Request) throws -> ResponseRepresentable {
        return JSON([":)"])
    }
    
}
