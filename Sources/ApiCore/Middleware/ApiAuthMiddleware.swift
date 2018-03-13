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
    
    public var serviceIsSingleton: Bool = true
    
    public func makeService(for worker: Container) throws -> Any {
        return self
    }
    
    public static var allowedGetUri: [String] = [
        "/auth",
        "/token",
        "/ping",
        "/teapot",
        ]
    
    public static var allowedPostUri: [String] = [
        "/users",
        "/auth",
        "/token",
        "/teams/check"
    ]
    
    public static var debugUri: [String] = [
        "/install",
        "/demo",
        "/tables",
        "/reinstall",
        "/uninstall"
    ]
    
    public func respond(to req: Request, chainingTo next: Responder) throws -> Future<Response> {
        debug(request: req)
        
        // Maintenance URI
        if ApiAuthMiddleware.debugUri.contains(req.http.uri.path) {
            self.printUrl(req: req, type: .maintenance)
            
            if req.environment == .production {
                throw ErrorsCore.HTTPError.notAuthorized
            }
            
            return try next.respond(to: req)
        }
        
        // Unsecured URI
        if self.allowed(request: req) {
            self.printUrl(req: req, type: .unsecured)
            
            return try next.respond(to: req)
        }
        
        // Secured
        self.printUrl(req: req, type: .secured)
        
        let userPayload = try jwtPayload(request: req)
        return User.find(userPayload.userId, on: req).flatMap(to: Response.self) { user in
            guard let user = user else {
                throw ErrorsCore.HTTPError.notAuthorized
            }
            let authenticationCache = try req.make(AuthenticationCache.self, for: Request.self)
            authenticationCache[User.self] = user
            
            return try next.respond(to: req)
        }
    }
    
    private func jwtPayload(request req: Request) throws -> JWTAuthPayload {
        // Get JWT token
        guard let token = req.http.headers.authorizationToken else {
            throw ErrorsCore.HTTPError.notAuthorized
        }
        let jwtService: JWTService = try req.make()
        
        // Get user payload
        guard let userPayload = try? JWT<JWTAuthPayload>(from: token, verifiedUsing: jwtService.signer).payload else {
            throw ErrorsCore.HTTPError.notAuthorized
        }
        
        return userPayload
    }
    
    private func debug(request req: Request) {
        if ApiCore.debugRequests {
            var contentString: String? {
                guard let data = try? req.http.body.makeData(max: 500).await(on: req) else {
                    return nil
                }
                return String(data: data, encoding: .utf8)
            }
            
            print("Debugging response:")
            print("HTTP [\(req.http.version.major).\(req.http.version.minor)] with status code [\(req.http)]")
            print("Headers:")
            for header in req.http.headers {
                print("\t\(header.name.description) = \(header.value)")
            }
            print("Content:")
            if let s = contentString {
                print("\tContent:\n\(s)")
            }
        }
    }
    
    private func allowed(request req: Request) -> Bool {
        if req.http.method == .get {
            return ApiAuthMiddleware.allowedGetUri.contains(req.http.uri.path)
        } else if req.http.method == .post {
            return ApiAuthMiddleware.allowedPostUri.contains(req.http.uri.path)
        }
        return false
    }
    
    private func printUrl(req: Request, type: Security) {
        if req.environment != .production {
            print("\(type.rawValue): [\(req.http.method.string)] \(req.http.uri.path)")
        }
    }
    
    public init() { }
    
}

