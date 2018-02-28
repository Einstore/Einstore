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
        router.get("auth") { (req)->Future<Response> in
            guard let token = req.http.headers.authorizationToken, let decoded = token.base64Decoded else {
                throw AuthError.authenticationFailed
            }
            let parts = decoded.split(separator: ":")
            guard parts.count == 2, let loginData = User.Auth.Login(email: String(parts[0]), password: String(parts[1])) else {
                throw AuthError.authenticationFailed
            }
            return try login(request: req, login: loginData)
        }
        
        router.post("auth") { (req)->Future<Response> in
            do {
                return try req.content.decode(User.Auth.Login.self).flatMap(to: Response.self) { (loginData) -> Future<Response> in
                    return try login(request: req, login: loginData)
                }
            } catch {
                throw AuthError.authenticationFailed
            }
        }

        router.get("token") { (req)->Future<Response> in
            guard let tokenString = req.http.headers.authorizationToken else {
                throw AuthError.authenticationFailed
            }
            return try token(request: req, token: tokenString)
        }
        
        router.post("token") { (req) -> Future<Response> in
            return try req.content.decode(User.Auth.Token.self).flatMap(to: Response.self) { (loginData) -> Future<Response> in
                return try token(request: req, token: loginData.token)
            }
        }
    }
    
}


extension AuthController {
    
    static func token(request req: Request, token: String) throws -> Future<Response> {
        return try Token.query(on: req).filter(\Token.token == token.passwordHash(req)).first().flatMap(to: Response.self, { (token) -> Future<Response> in
            guard let token = token else {
                throw AuthError.authenticationFailed
            }
            return User.with(id: token.userId, on: req).flatMap(to: Response.self, { (user) -> Future<Response> in
                guard let user = user else {
                    throw AuthError.authenticationFailed
                }
                return try Token.Public(token: token, user: user).asResponse(.ok, to: req).map(to: Response.self, { (response) -> Response in
                    let jwt = try JWTHelper.jwtToken(for: user)
                    response.http.headers["Authorization"] = "Bearer \(jwt)"
                    return response
                })
            })
        })
    }
    
    static func login(request req: Request, login: User.Auth.Login) throws -> Future<Response> {
        guard !login.email.isEmpty, !login.password.isEmpty else {
            throw AuthError.authenticationFailed
        }
        return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
            return try User.query(on: db).filter(\User.email == login.email).filter(\User.password == login.password.passwordHash(req)).first().flatMap(to: Response.self) { (user) -> Future<Response> in
                guard let user = user else {
                    throw AuthError.authenticationFailed
                }
                let token = try Token(user: user)
                let tokenBackup = token
                token.token = try token.token.passwordHash(req)
                return token.save(on: db).flatMap(to: Response.self) { token in
                    tokenBackup.id = token.id
                    
                    let publicToken = Token.PublicFull(token: tokenBackup, user: user)
                    return try publicToken.asResponse(.ok, to: req).map(to: Response.self, { (response) -> Response in
                        let jwt = try JWTHelper.jwtToken(for: user)
                        response.http.headers["Authorization"] = "Bearer \(jwt)"
                        return response
                    })
                }
            }
        }
    }
    
}

