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
        router.get(PathComponent.anything) { req in
            return try req.response.badUrl()
        }
        
        router.post(PathComponent.anything) { req in
            return try req.response.badUrl()
        }
        
        router.put(PathComponent.anything) { req in
            return try req.response.badUrl()
        }
        
        router.patch(PathComponent.anything) { req in
            return try req.response.badUrl()
        }
        
        router.delete(PathComponent.anything) { req in
            return try req.response.badUrl()
        }
    }
    
}
