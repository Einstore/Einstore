//
//  Droplet+Tools.swift
//  Boost
//
//  Created by Ondrej Rafaj on 25/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor


extension Droplet {
    
    func register(controller: ControllerProtocol) {
        controller.configureRoutes(self)
    }
    
}
