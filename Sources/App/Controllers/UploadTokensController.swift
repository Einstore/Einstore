//
//  UploadTokensController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 09/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import HTTP


final class UploadTokensController: RootController, ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes() {
        let basic = self.baseRoute.grouped("tokens")
        basic.get(handler: self.index)
        basic.put(IdType.self) { request, objectId in
            return try self.put(request: request, objectId: objectId)
        }
        basic.delete(IdType.self) { request, objectId in
            return try self.delete(request: request, objectId: objectId)
        }
    }
    
    // MARK: Data pages
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        return ":)"
    }
    
    func put(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        return "You requested User #\(objectId)"
    }
    
    func delete(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        return "You requested User #\(objectId)"
    }
    
}
