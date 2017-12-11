//
//  UsersController.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor


public class UsersController: Controller {
    
    enum UsersControllerError: Error {
        case notAuthenticated
    }
    
    public static func boot(router: Router) throws {
        router.get("users") { req -> Future<[User]> in
            guard let _ = Authentication.me(req) else {
                //return HTTPResponse(status: .ok)
                throw UsersControllerError.notAuthenticated
            }
            return User.all(req)
        }
    }
    
}
