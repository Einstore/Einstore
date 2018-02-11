//
//  MyDebugMiddleware.swift
//  ErrorsCore
//
//  Created by Ondrej Rafaj on 13/12/2017.
//

import Foundation
import Async
import Debugging
import HTTP
import Service
import Vapor


public final class UrlDebugMiddleware: Middleware, ServiceFactory {
    
    public var serviceType: Any.Type = UrlDebugMiddleware.self
    
    public var serviceSupports: [Any.Type] = []
    
    public var serviceTag: String?
    
    public var serviceIsSingleton: Bool = false
    
    public func makeService(for worker: Container) throws -> Any {
        return self
    }
    
    public func respond(to req: Request, chainingTo next: Responder) throws -> Future<Response> {
        if req.environment != .production {
            print("[\(req.http.method.string)] \(req.http.uri.path)")
        }
        return try next.respond(to: req)
    }
    
    public init() { }
    
}
