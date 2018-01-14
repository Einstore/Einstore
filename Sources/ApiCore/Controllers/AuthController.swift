//
//  AuthController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 13/01/2018.
//

import Foundation
import Vapor
import FluentMySQL
import DbCore
import Crypto
import ApiErrors


public class AuthController: Controller {
    
    enum AuthError: FrontendError {
        case authenticationFailed
        
        public var code: String {
            return "auth_error"
        }
        
        public var status: HTTPStatus {
            return .unauthorized
        }
        
        public var description: String {
            switch self {
            case .authenticationFailed:
                return "Authentication has failed"
            }
        }
    }
    
    public static func boot(router: Router) throws {
        router.get("auth") { (req)->Future<Token> in
            guard let token = req.headers.authorizationToken, let decoded = token.base64Decoded else {
                throw AuthError.authenticationFailed
            }
            let parts = decoded.split(separator: ":")
            guard parts.count == 2, let loginData = User.Login(email: String(parts[0]), password: String(parts[1])) else {
                throw AuthError.authenticationFailed
            }
            return try login(request: req, login: loginData)
        }
        
        router.post("auth") { (req)->Future<Token> in
            let loginData: User.Login
            do {
                loginData = try req.content.decode(User.Login.self)
            } catch {
                throw AuthError.authenticationFailed
            }
            return try login(request: req, login: loginData)
        }

//        router.get("token") { req in
//            req.withPooledConnection(to: .db, closure: { (db) -> Future<Token.Public> in
//
//            })
//        }
//
//        router.post("token") { req in
//            req.withPooledConnection(to: .db, closure: { (db) -> Future<Token.Public> in
//
//            })
//        }
    }
    
}


extension AuthController {
    
    static func login(request req: Request, login: User.Login) throws -> Future<Token> {
        guard !login.email.isEmpty, !login.password.isEmpty else {
            throw AuthError.authenticationFailed
        }
        return req.withPooledConnection(to: .db, closure: { (db) -> Future<Token> in
            return User.query(on: db).filter(\User.email == login.email).filter(\User.password == login.password.passwordHash).first().flatMap(to: Token.self, { (user) -> Future<Token> in
                guard let user = user else {
                    throw AuthError.authenticationFailed
                }
                let token = try Token(user: user)
                return token.save(on: db).map(to: Token.self, { _ in
                    return token
                })
            })
        })
    }
    
}
