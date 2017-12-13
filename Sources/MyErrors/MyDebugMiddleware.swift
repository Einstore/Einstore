//
//  MyDebugMiddleware.swift
//  MyErrors
//
//  Created by Ondrej Rafaj on 13/12/2017.
//

import Foundation


import Async
import Debugging
import HTTP
import Service
import Vapor


public final class MyDebugMiddleware: Middleware {
    
    public func respond(to req: Request, chainingTo next: Responder) throws -> Future<Response> {
        if req.environment != .production {
            print("[\(req.method.string)] \(req.uri.path)")
        }
        return try next.respond(to: req)
    }
    
    public init() { }
    
}
