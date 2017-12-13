//
//  MyErrorsMiddleware.swift
//  MyErrors
//
//  Created by Ondrej Rafaj on 12/12/2017.
//

import Foundation
import Async
import Debugging
import HTTP
import Service
import Vapor


public final class MyErrorMiddleware: Middleware {
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
        
        func handleError(_ error: Swift.Error) {
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
            
            let res = req.makeResponse()
            res.http.body = HTTPBody(string: "Boost: \(reason)")
            res.http.status = status
            promise.complete(res)
        }
        
        do {
            try next.respond(to: req).do { res in
                promise.complete(res)
                }.catch { error in
                    handleError(error)
            }
        } catch {
            handleError(error)
        }
        
        return promise.future
    }
}
