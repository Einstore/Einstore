//
//  Request+Errors.swift
//  ErrorsCore
//
//  Created by Ondrej Rafaj on 13/01/2018.
//

import Foundation
import Vapor
import Fluent


public struct ErrorResponse: Content {
    let error: String
    let description: String
}

public struct SuccessResponse: Content {
    let code: String
    let description: String?
}


public struct RequestResponse {
    
    let request: Request
    
    public init(req: Request) {
        self.request = req
    }
    
    // MARK: Generators
    
    public func basic(status: HTTPStatus = .ok) throws -> Response {
        let response = Response(using: request)
        response.http.status = status
        
        let headers = HTTPHeaders(dictionaryLiteral: (.contentType, "application/json; charset=utf-8"))
        response.http.headers = headers
        
        return response
    }
    
    public func error(status: HTTPStatus, error: String, description: String) throws -> Response {
        let response = try basic(status: status)
        
        let responseObject = ErrorResponse(error: error, description: description)
        let encoder = JSONEncoder()
        response.http.body = try HTTPBody(encoder.encode(responseObject))
        
        return response
    }
    
    public func success(status: HTTPStatus = .ok, code: String, description: String? = nil) throws -> Response {
        let response = try basic(status: status)
        
        let responseObject = SuccessResponse(code: code, description: description)
        let encoder = JSONEncoder()
        response.http.body = try HTTPBody(encoder.encode(responseObject))
        
        return response
    }
    
    public func notFound() throws -> Response {
        // TODO: make "not_found" come from HTTPStatus
        let response = try error(status: .notFound, error: "not_found", description: "Not found")
        return response
    }
    
    public func badUrl() throws -> Response {
        let response = try error(status: .notFound, error: "not_found", description: "Endpoint doesn't exist; See http://boost.docs.apiary.io for API documentation")
        return response
    }
    
    public func noContent() throws -> Response {
        let response = try basic(status: .noContent)
        return response
    }
    
    public func onlyInDebug() throws -> Response {
        let response = try error(status: .preconditionFailed, error: "not_available", description: "Endpoint is not available in production mode")
        return response
    }
    
    public func maintenanceFinished(message: String) throws -> Response {
        let response = try success(code: "maintenance_ok", description: message)
        return response
    }
    
    public func teapot() throws -> Response {
        let response = try success(status: .imATeapot, code: "teapot", description: """
            I'm a little teapot
            Short and stouts
            Here is my handle
            Here is my spout
            When I get all steamed up
            I just shout
            Tip me over and pour me out
            """
        )
        return response
    }
    
    public func ping() throws -> Response {
        let response = try success(code: "pong")
        return response
    }
    
    public func internalServerError(message: String) throws -> Response {
        let response = try error(status: .internalServerError, error: "server_err", description: message)
        return response
    }
    
}


public extension Request {
    
    public var response: RequestResponse {
        return RequestResponse(req: self)
    }
    
}
