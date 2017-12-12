//
//  UsersController.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor


public class UsersController: Controller {
    
    public static func boot(router: Router) throws {
        router.get("users") { req -> Future<[User]> in
            guard let _ = Authentication.me(req) else {
                throw Errors.notAuthorised
            }
            return User.all(req)
        }
    }
    
}
