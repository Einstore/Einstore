//
//  UsersController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 24/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP


final class UsersController: ResourceRepresentable {
    
    static func sayHello(_ req: Request) throws -> ResponseRepresentable {
        guard let name = req.data["name"] else {
            throw Abort.badRequest
        }
        return "Hello, \(name)"
    }
    
    func makeResource() -> Resource<Post> {
        return Resource(
            index: UsersController.sayHello
        )
    }
    
}
