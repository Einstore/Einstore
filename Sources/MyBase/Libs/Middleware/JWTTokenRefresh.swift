//
//  JWTTokenRefresh.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 12/12/2017.
//

import Foundation
import Vapor
import MyErrors


public final class JWTTokenMiddleware: Middleware, ServiceFactory {
    
    public var serviceType: Any.Type = JWTTokenMiddleware.self
    
    public var serviceSupports: [Any.Type] = []
    
    public var serviceTag: String?
    
    public var serviceIsSingleton: Bool = false
    
    public func makeService(for worker: Container) throws -> Any {
        return self
    }
    
    public func respond(to request: Request, chainingTo next: Responder) throws -> Future<Response> {
        let response = try next.respond(to: request)
        response.addAwaiter { (response) in
            switch response {
            case .expectation(let response):
                // TODO: Only add JWT to a valid and authorised requests
                response.headers["JWT"] = "My new JWT Token!"
            case .error(let error):
                print(error)
                break
            }
        }
        return response
    }
    
    public init() { }
    
}
