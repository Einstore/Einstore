//
//  UsersController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 28/12/2017.
//

import Foundation
import Vapor
import FluentPostgreSQL


public class UsersController: Controller {
    
    public static func boot(router: Router) throws {
        router.get("users") { req in
            req.withPooledConnection(to: .db, closure: { (db) -> Future<[User.Display]> in
                return User.Display.query(on: db).all()
            })
        }
    }
    
}
