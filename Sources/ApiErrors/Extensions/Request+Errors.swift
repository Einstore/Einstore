//
//  Request+Errors.swift
//  ApiErrors
//
//  Created by Ondrej Rafaj on 13/01/2018.
//

import Foundation
import Vapor


public struct ErrorResponse: Content {
    let error: String
    let description: String
}

public struct SuccessResponse: Content {
    let code: String
    let description: String
}


public struct RequestResponse {
    
    let request: Request
    
    public init(req: Request) {
        self.request = req
    }
    
    // MARK: Generators
    
    public func basicRequest(status: HTTPStatus = .ok) throws -> Response {
        let response = Response(using: request)
        response.status = status
        
        let headers = HTTPHeaders(dictionaryLiteral: (.contentType, "application/json; charset=utf-8"))
        response.headers = headers
        
        return response
    }
    
    public func errorRequest(status: HTTPStatus, error: String, description: String) throws -> Response {
        let response = try basicRequest(status: status)
        
        let responseObject = ErrorResponse(error: error, description: description)
        let encoder = JSONEncoder()
        response.body = try HTTPBody(encoder.encode(responseObject))
        
        return response
    }
    
    public func successRequest(status: HTTPStatus = .ok, code: String, description: String) throws -> Response {
        let response = try basicRequest(status: status)
        
        let responseObject = SuccessResponse(code: code, description: description)
        let encoder = JSONEncoder()
        response.body = try HTTPBody(encoder.encode(responseObject))
        
        return response
    }
    
    public func notFound() throws -> Response {
        // TODO: make "not_found" come from HTTPStatus
        let response = try errorRequest(status: .notFound, error: "not_found", description: "Not found")
        return response
    }
    
    public func badUrl() throws -> Response {
        let response = try errorRequest(status: .notFound, error: "not_found", description: "Endpoint doesn't exist; See http://boost.docs.apiary.io for API documentation")
        return response
    }
    
    public func onlyInDebug() throws -> Response {
        let response = try errorRequest(status: .preconditionFailed, error: "not_available", description: "Endpoint is not available in production mode")
        return response
    }
    
    public func maintenanceFinished(message: String) throws -> Response {
        let response = try successRequest(code: "maintenance_ok", description: message)
        return response
    }
    
    public func internalServerError(message: String) throws -> Response {
        let response = try errorRequest(status: .internalServerError, error: "server_err", description: message)
        return response
    }
    
}


public extension Request {
    
    public var response: RequestResponse {
        return RequestResponse(req: self)
    }
    
}
