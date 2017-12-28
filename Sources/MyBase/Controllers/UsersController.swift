//
//  UsersController.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor
import MyErrors


public class UsersController: Controller {
    
    public static func boot(router: Router) throws {
        router.get("users") { req -> Future<[User.Display]> in
            guard let _ = Authentication.me(req) else {
                throw Errors.notAuthorised
            }
            return User.Display.all(req)
        }
        
        // TODO: Return just one user if successful
//        router.post("register") { req -> Future<User.Display> in
//            guard let registration: User.Registration = try? req.content.decode(User.Registration.self) else {
//                throw MyHTTPError.missingRequestData
//            }
//            
//            let user = registration.newUser
//            return try user.insert(req).map(to: User.Display.self, { (id) -> Future<User.Display> in
//                let user = user.display
//                user.id = id
//                let future = Future<User.Display>(user)
//                return future
//            })
//        }
        
        router.post("login") { req -> Future<[User.Display]> in
            guard let login: User.Login = try? req.content.decode(User.Login.self) else {
                throw MyHTTPError.missingAuthorizationData
            }
            let result = req.pool.retain({ (connection) -> Future<[User.Display]> in
                let query = User.Display.login(with: login.email, password: login.password)
                return connection.all(User.Display.self, in: query)
            })
            
            return result
        }
        
        router.post("auth") { req -> Future<[User.Display]> in
            guard let login: User.Login = try? req.content.decode(User.Login.self) else {
                throw MyHTTPError.missingAuthorizationData
            }
            let result = req.pool.retain({ (connection) -> Future<[User.Display]> in
                let query = User.Display.login(with: login.email, password: login.password)
                return connection.all(User.Display.self, in: query)
            })
            
            return result
        }
    }
    
}
