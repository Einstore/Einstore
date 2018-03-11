//
//  ErrorLoggingMiddleware.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 11/03/2018.
//

import Foundation
import Async
import Debugging
import HTTP
import Service
import Vapor
import ErrorsCore


public final class ErrorLoggingMiddleware: Middleware, ServiceFactory {
    
    public var serviceType: Any.Type = ErrorLoggingMiddleware.self
    
    public var serviceSupports: [Any.Type] = []
    
    public var serviceTag: String?
    
    public var serviceIsSingleton: Bool = true
    
    public func makeService(for worker: Container) throws -> Any {
        return self
    }
    
    public func respond(to req: Request, chainingTo next: Responder) throws -> Future<Response> {
        return try next.respond(to: req).catchFlatMap({ (error) -> (Future<Response>) in
            return ErrorLog(uri: req.http.uri.path, method: req.http.method, error: error).save(on: req).flatMap(to: Response.self) { log in
                return try next.respond(to: req)
            }
        })
    }
    
    public init() { }
    
}
