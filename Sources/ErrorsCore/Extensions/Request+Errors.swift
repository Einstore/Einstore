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
    public let error: String
    public let description: String
}

public struct SuccessResponse: Content {
    public let code: String
    public let description: String?
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
        
        let headers = HTTPHeaders([("Content-Type", "application/json; charset=utf-8")])
        response.http.headers = headers
        
        return response
    }
    
    public func error(status: HTTPStatus, error: String, description: String) throws -> Response {
        let response = try basic(status: status)
        
        let responseObject = ErrorResponse(error: error, description: description)
        let encoder = JSONEncoder()
        response.http.body = try HTTPBody(data: encoder.encode(responseObject))
        
        return response
    }
    
    public func success(status: HTTPStatus = .ok, code: String, description: String? = nil) throws -> Response {
        let response = try basic(status: status)
        
        let responseObject = SuccessResponse(code: code, description: description)
        let encoder = JSONEncoder()
        response.http.body = try HTTPBody(data: encoder.encode(responseObject))
        
        return response
    }
    
    public func notFound() throws -> Response {
        // TODO: make "not_found" come from HTTPStatus
        let response = try error(status: .notFound, error: "not_found", description: "Not found")
        return response
    }
    
    public func notAuthorized() throws -> Response {
        let response = try error(status: .unauthorized, error: "not_authorized", description: "Not authorized")
        return response
    }
    
    public func authExpired() throws -> Response {
        let response = try error(status: .unauthorized, error: "not_authorized", description: "Authorization expired")
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
    
    public func deleted() throws -> Response {
        let res = try noContent()
        return res
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
        let response = try success(status: .custom(code: 418, reasonPhrase: "I am teapot"), code: "teapot", description: """
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
    
    public func cors() throws -> Response {
        let response = try noContent()
        response.http.headers.replaceOrAdd(name: HTTPHeaderName.contentType, value: "application/json")
        response.http.headers.replaceOrAdd(name: HTTPHeaderName.accessControlAllowMethods, value: "GET,POST,PUT,PATCH,DELETE")
        let origin = request.http.headers["Origin"].first ?? "*"
        response.http.headers.replaceOrAdd(name: HTTPHeaderName.accessControlAllowOrigin, value: origin)
        response.http.headers.replaceOrAdd(name: HTTPHeaderName.accessControlExpose, value: [
            HTTPHeaderName.authorization.description,
            HTTPHeaderName.contentType.description,
            HTTPHeaderName.cacheControl.description,
            HTTPHeaderName.contentDisposition.description,
            HTTPHeaderName.contentLength.description,
            HTTPHeaderName.userAgent.description,
            HTTPHeaderName.expires.description
            ].joined(separator: ", ")
        ) // Headers to be exposed to the client
        var headers: [String] = []
        var isContentType: Bool = false
        for header in request.http.headers {
            if (header.name.lowercased() == "content-type") {
                isContentType = true
            }
            headers.append(header.name)
        }
        if !isContentType {
            headers.append("Content-Type")
        }
        //headers.append("*")
        if !headers.contains("Authorization") {
            headers.append("Authorization")
        }
        response.http.headers.replaceOrAdd(name: HTTPHeaderName.accessControlAllowHeaders, value: headers.joined(separator: ","))
        response.http.headers.replaceOrAdd(name: HTTPHeaderName.accessControlMaxAge, value: "5")
        return response
    }
    
}


public extension Request {
    
    public var response: RequestResponse {
        return RequestResponse(req: self)
    }
    
}
