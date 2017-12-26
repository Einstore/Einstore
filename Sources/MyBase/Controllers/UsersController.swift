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
        router.get("users") { req -> Future<[User]> in
            guard let _ = Authentication.me(req) else {
                throw Errors.notAuthorised
            }
            return User.all(req)
        }
        
        // TODO: Return just one user if successful
        router.post("register") { req -> Future<[User]> in
            guard let registration: Registration = try? req.content.decode(Registration.self) else {
                throw MyHTTPError.missingRequestData
            }
            let result = req.pool.retain({ (connection) -> Future<[User]> in
                var user = registration.newUser
                do {
                    let lastId = try user.query.insert(req)
                    if lastId > 0 {
                        user.id = lastId
                    }
                    
                } catch {
                    // TODO: Handle error
                    print(error)
                }
                return Future<[User]>([user])
            })
            
            return result
        }
        
        router.post("login") { req -> Future<[User]> in
            guard let login: Login = try? req.content.decode(Login.self) else {
                throw MyHTTPError.missingAuthorizationData
            }
            let result = req.pool.retain({ (connection) -> Future<[User]> in
                let query = User.login(with: login.email, password: login.password)
                return connection.all(User.self, in: query)
            })
            
            return result
        }
        
        router.post("auth") { req -> Future<[User]> in
            guard let login: Login = try? req.content.decode(Login.self) else {
                throw MyHTTPError.missingAuthorizationData
            }
            let result = req.pool.retain({ (connection) -> Future<[User]> in
                let query = User.login(with: login.email, password: login.password)
                return connection.all(User.self, in: query)
            })
            
            return result
        }
    }
    
}
