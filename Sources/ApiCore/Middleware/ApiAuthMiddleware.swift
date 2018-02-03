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
import ApiErrors


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
    
    lazy var allowedUri: [String] = [
        "/auth",
        "/token",
        "/ping",
        "/teapot"
    ]
    
    lazy var debugUri: [String] = [
        "/install",
        "/demo",
        "/tables",
        "/reinstall",
        "/uninstall"
    ]
    
    public func respond(to req: Request, chainingTo next: Responder) throws -> Future<Response> {
        // Maintenance URI
        if debugUri.contains(req.http.uri.path) {
            printUrl(req: req, type: .maintenance)
            
            if req.environment != .production {
                return try next.respond(to: req)
            }
            else {
                let promise = Promise<Response>()
                try promise.complete(req.response.onlyInDebug())
                return promise.future
            }
        }
        
        // Secured URI
        guard allowedUri.contains(req.http.uri.path) else {
            printUrl(req: req, type: .secured)
            
//            let authCache = AuthenticationCache(userId: 1, teamIds: [1])
//            req.privateContainer
            
            return try next.respond(to: req)
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

