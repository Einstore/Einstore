//
//  ApiAuthMiddleware.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 13/01/2018.
//

import Foundation
import Async
import Debugging
import HTTP
import Service
import Vapor
import ErrorsCore
import JWT


public final class ApiAuthMiddleware: Middleware, ServiceFactory {
    
    enum Security: String {
        case unsecured = "Unsecured"
        case secured = "Secured"
        case maintenance = "Maintenance"
    }
    
    public var serviceType: Any.Type = ApiAuthMiddleware.self
    
    public var serviceSupports: [Any.Type] = []
    
    public var serviceTag: String?
    
    public var serviceIsSingleton: Bool = false
    
    public func makeService(for worker: Container) throws -> Any {
        return self
    }
    
    public static var allowedGetUri: [String] = [
        "/auth",
        "/token",
        "/ping",
        "/teapot",
        "/teams/check"
    ]
    
    public static var allowedPostUri: [String] = [
        "/users"
    ]
    
    public static var debugUri: [String] = [
        "/install",
        "/demo",
        "/tables",
        "/reinstall",
        "/uninstall"
    ]
    
    public func respond(to req: Request, chainingTo next: Responder) throws -> Future<Response> {
        // Maintenance URI
        if ApiAuthMiddleware.debugUri.contains(req.http.uri.path) {
            printUrl(req: req, type: .maintenance)
            
            if req.environment != .production {
                return try next.respond(to: req)
            }
            else {
                return try Future(req.response.onlyInDebug())
            }
        }
        
        func allowed(request req: Request) -> Bool {
            if req.http.method == .get {
                return ApiAuthMiddleware.allowedGetUri.contains(req.http.uri.path)
            } else if req.http.method == .post {
                return ApiAuthMiddleware.allowedPostUri.contains(req.http.uri.path)
            }
            return false
        }
        
        // Secured URI
        guard allowed(request: req) else {
            printUrl(req: req, type: .secured)
            
            // Get JWT token
            guard let token = req.http.headers.authorizationToken else {
                return try Future(req.response.notAuthorized())
            }
            let jwtService: JWTService = try req.make()
            
            // Get user payload
            guard let userPayload = try? JWT<JWTAuthPayload>(from: token, verifiedUsing: jwtService.signer).payload else {
                return try Future(req.response.authExpired())
            }
            
            return User.find(userPayload.userId, on: req).flatMap(to: Response.self) { user in
                guard let user = user else {
                    return try Future(req.response.notAuthorized())
                }
                let authenticationCache = try req.make(AuthenticationCache.self, for: Request.self)
                authenticationCache[User.self] = user
                return try next.respond(to: req)
            }
        }
        
        // Unsecured URI
        printUrl(req: req, type: .unsecured)
        
        // Respond to request
        return try next.respond(to: req)
    }
    
    private func printUrl(req: Request, type: Security) {
        if req.environment != .production {
            print("\(type.rawValue): [\(req.http.method.string)] \(req.http.uri.path)")
        }
    }
    
    public init() { }
    
}

