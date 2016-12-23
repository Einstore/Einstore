//
//  AppController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 26/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP


final class AppController: RootController, ControllerProtocol {
    
    // MARK: Routing
    
    func setupGenericRouteForAllNonRoutedPaths() {
        drop.get("*") { request in
            return ResponseBuilder.notImplemented
        }
        drop.post("*") { request in
            return ResponseBuilder.notImplemented
        }
        drop.delete("*") { request in
            return ResponseBuilder.notImplemented
        }
        drop.put("*") { request in
            return ResponseBuilder.notImplemented
        }
        drop.patch("*") { request in
            return ResponseBuilder.notImplemented
        }
    }
    
    func configureRoutes() {
        drop.get(handler: self.root)
        
        self.setupGenericRouteForAllNonRoutedPaths()
        
        
        self.baseRoute.get(handler: self.root)
        
        // Ping
        self.baseRoute.get(handler: self.ping)
        
        // Tea
        self.baseRoute.get("tea") { request in
            return ResponseBuilder.teapot
        }
    }
    
    // MARK: Intro
    
    func root(request: Request) throws -> ResponseRepresentable {
        return ResponseBuilder.build(json: JSON(["Boost Enterprise AppStore": "https://github.com/manGoweb/Boost"]))
    }
    
    // MARK: Data pages
    
    func ping(request: Request) throws -> ResponseRepresentable {
        return ResponseBuilder.build(json: JSON(["result": "success", "message": Lang.get("Johnny 5 is alive").makeNode()]))
    }
    
}
