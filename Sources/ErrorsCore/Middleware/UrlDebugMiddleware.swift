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


public final class UrlDebugMiddleware: Middleware, Service {
    
    public func respond(to req: Request, chainingTo next: Responder) throws -> Future<Response> {
        if req.environment != .production {
            let logger = try req.make(Logger.self)
            let method = req.http.method
            let path = req.http.url.path
            let query = req.http.url.query
            var reqString = "\(method) \(path)"
            if let q = query {
                reqString += "?\(q)"
            }
            logger.debug(reqString)
        }
        return try next.respond(to: req)
    }
    
    public init() { }
    
}
