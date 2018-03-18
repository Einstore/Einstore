//
//  GenericController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 13/01/2018.
//

import Foundation
import Vapor
import ErrorsCore


public class GenericController: Controller {
    
    public static func boot(router: Router) throws {
        router.get(DynamicPathComponent.anything) { req in
            return try req.response.badUrl()
        }
        
        router.post(DynamicPathComponent.anything) { req in
            return try req.response.badUrl()
        }
        
        router.put(DynamicPathComponent.anything) { req in
            return try req.response.badUrl()
        }
        
        router.patch(DynamicPathComponent.anything) { req in
            return try req.response.badUrl()
        }
        
        router.delete(DynamicPathComponent.anything) { req in
            return try req.response.badUrl()
        }
        
        router.get("teapot") { req in
            return try req.response.teapot()
        }
        
        router.get("ping") { req in
            return try req.response.ping()
        }
    }
    
}
