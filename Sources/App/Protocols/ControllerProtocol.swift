//
//  ControllerProtocol.swift
//  Boost
//
//  Created by Ondrej Rafaj on 25/11/2016.
//
//

import Vapor


protocol ControllerProtocol {
    
    func configureRoutes(_ drop: Droplet)
    
}
