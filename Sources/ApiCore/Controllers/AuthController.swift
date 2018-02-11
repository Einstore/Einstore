//
//  AuthController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 13/01/2018.
//

import Foundation
import Vapor
import FluentPostgreSQL
import DbCore
import Crypto
import ErrorsCore


public class AuthController: Controller {
    
    public static func boot(router: Router) throws {
        router.get("auth") { (req)->Future<Token> in
            guard let token = req.http.headers.authorizationToken, let decoded = token.base64Decoded else {
                throw AuthError.authenticationFailed
            }
            let parts = decoded.split(separator: ":")
            guard parts.count == 2, let loginData = User.Auth.Login(email: String(parts[0]), password: String(parts[1])) else {
                throw AuthError.authenticationFailed
            }
            return try login(request: req, login: loginData)
        }
        
        router.post("auth") { (req)->Future<Token> in
            do {
                return try req.content.decode(User.Auth.Login.self).flatMap(to: Token.self, { (loginData) -> Future<Token> in
                    return try login(request: req, login: loginData)
                })
            } catch {
                throw AuthError.authenticationFailed
            }
        }

//        router.get("token") { req in
//            req.withPooledConnection(to: .db) { (db) -> Future<Token.Public> in
//
//            })
//        }
//
//        router.post("token") { (req) -> Future<User.Auth> in
//            do {
//                return try req.content.decode(User.Auth.Token.self).flatMap(to: Token.self) { (loginData) -> Future<User.Auth> in
//                    return req.withPooledConnection(to: .db) { (db) -> Future<User.Auth> in
//                        return Token.query(on: db).filter(\Token.token == "token_value_xxxx".passwordHash).first().flatMap(to: User.Auth.self, { (token) -> Future<User.Auth> in
//                            let promise = Promise<User.Auth>()
//                            return promise.future
//                        })
//                    }
//                }
//            } catch {
//                throw AuthError.authenticationFailed
//            }
//        }
    }
    
}


extension AuthController {
    
    static func login(request req: Request, login: User.Auth.Login) throws -> Future<Token> {
        guard !login.email.isEmpty, !login.password.isEmpty else {
            throw AuthError.authenticationFailed
        }
        return req.withPooledConnection(to: .db) { (db) -> Future<Token> in
            return User.query(on: db).filter(\User.email == login.email).filter(\User.password == login.password.passwordHash).first().flatMap(to: Token.self, { (user) -> Future<Token> in
                guard let user = user else {
                    throw AuthError.authenticationFailed
                }
                let token = try Token(user: user)
                let tokenBackup = token
                token.token = token.token.passwordHash
                return token.save(on: db).map(to: Token.self, { _ in
                    tokenBackup.id = token.id
                    return tokenBackup
                })
            })
        }
    }
    
}
