//
//  ApiErrorsMiddleware.swift
//  ApiErrors
//
//  Created by Ondrej Rafaj on 12/12/2017.
//

import Foundation
import Async
import Debugging
import HTTP
import Service
import Vapor


public final class ApiErrorsMiddleware: Middleware, ServiceFactory {
    
    public var serviceType: Any.Type = ApiErrorsMiddleware.self
    
    public var serviceSupports: [Any.Type] = []
    
    public var serviceTag: String?
    
    public var serviceIsSingleton: Bool = false
    
    public func makeService(for worker: Container) throws -> Any {
        return self
    }
    
    /// The environment to respect when presenting errors.
    let environment: Environment
    
    /// Log destination
    let log: Logger
    
    /// Create a new ErrorMiddleware for the supplied environment.
    public init(environment: Environment, log: Logger) {
        self.environment = environment
        self.log = log
    }
    
    /// See `Middleware.respond`
    public func respond(to req: Request, chainingTo next: Responder) throws -> Future<Response> {
        let promise = Promise(Response.self)
        
        func handleError(_ error: Swift.Error) throws {
            if let frontendError = error as? FrontendError {
                let res = try req.response.errorRequest(status: frontendError.status, error: frontendError.code, description: frontendError.description)
                promise.complete(res)
                return
            }
            
            let reason: String
            let status: HTTPStatus
            
            switch environment {
            case .production:
                if let abort = error as? AbortError {
                    reason = abort.reason
                    status = abort.status
                } else {
                    status = .internalServerError
                    reason = "Something went wrong."
                }
            default:
                log.error(error.localizedDescription)
                
                if let debuggable = error as? Debuggable {
                    reason = debuggable.reason
                } else if let abort = error as? AbortError {
                    reason = abort.reason
                } else {
                    reason = "Something went wrong."
                }
                
                if let abort = error as? AbortError {
                    status = abort.status
                } else {
                    status = .internalServerError
                }
            }
            
            let res = try req.response.internalServerError(message: reason)
            res.status = status
            promise.complete(res)
        }
        
        do {
            try next.respond(to: req).do { res in
                promise.complete(res)
                }.catch { error in
                    // TODO: This doesn't return anything?!
                    try? handleError(error)
            }
        } catch {
            try handleError(error)
        }
        
        return promise.future
    }
}
