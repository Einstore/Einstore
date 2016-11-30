//
//  ResponseBuilder.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP
import Fluent


struct ResponseBuilder {
    
    
    // MARK: Response builders
    
    static func build<M: Model>(model: M, statusCode: Int = StatusCodes.success) -> ResponseRepresentable {
        do {
            let status: Status = .other(statusCode: statusCode, reasonPhrase: "Success")
            let response: Response = try Response.init(status: status, json: JSON(model.makeNode()))
            return response
        }
        catch {
            return self.internalServerError
        }
    }
    
    static func build(json: JSON, statusCode: Int = StatusCodes.success) -> ResponseRepresentable {
        do {
            let status: Status = .other(statusCode: statusCode, reasonPhrase: "Success")
            let response: Response = try Response.init(status: status, json: json)
            return response
        }
        catch {
            return self.internalServerError
        }
    }
    
    static func build(node: Node, statusCode: Int = StatusCodes.success) -> ResponseRepresentable {
        do {
            let status: Status = .other(statusCode: statusCode, reasonPhrase: "Success")
            let response: Response = try Response.init(status: status, json: JSON(node))
            return response
        }
        catch {
            return self.internalServerError
        }
    }
    
    // MARK: Validation responses
    
    static func validationErrorResponse(errors: [ValidationError]) -> ResponseRepresentable {
        do {
            let status: Status = .other(statusCode: StatusCodes.preconditionNotMet, reasonPhrase: "Validation error")
            var formattedErrors: [Node] = []
            for e: ValidationError in errors {
                let errorDetailNode = try ["type": e.validationType.rawValue, "localized": e.errorMessage].makeNode()
                let errorNode = try [e.name: errorDetailNode].makeNode()
                formattedErrors.append(errorNode)
            }
            let response: Response = try Response.init(status: status, json: JSON(formattedErrors.makeNode()))
            return response
        }
        catch {
            return self.internalServerError
        }
    }
    
    // MARK: Default responses
    
    static var okNoContent: ResponseRepresentable {
        get {
            return Response(status: .other(statusCode: StatusCodes.successNoData, reasonPhrase: "Success"))
        }
    }
    
    static var notFound: ResponseRepresentable {
        get {
            let response = Response(status: .other(statusCode: StatusCodes.notFound, reasonPhrase: "Not found"))
            response.headers["Content-Type"] = "application/json"
            response.body = try! Body(JSON(["error": "Not found"]))
            return response
        }
    }
    
    static var emailExists: ResponseRepresentable {
        get {
            let response = Response(status: .other(statusCode: StatusCodes.notAuthorised, reasonPhrase: "Email already registered"))
            response.headers["Content-Type"] = "application/json"
            response.body = try! Body(JSON(["error": "Email already registered"]))
            return response
        }
    }
    
    static var notAuthorised: ResponseRepresentable {
        get {
            let response = Response(status: .other(statusCode: StatusCodes.notAuthorised, reasonPhrase: "Not authorised"))
            response.headers["Content-Type"] = "application/json"
            response.body = try! Body(JSON(["error": "Not authorised"]))
            return response
        }
    }
    
    static var actionFailed: ResponseRepresentable {
        get {
            let response = Response(status: .other(statusCode: StatusCodes.forbidden, reasonPhrase: "Action failed"))
            response.headers["Content-Type"] = "application/json"
            response.body = try! Body(JSON(["error": "Action failed"]))
            return response
        }
    }
    
    static var teapot: ResponseRepresentable {
        get {
            let response = Response(status: .other(statusCode: StatusCodes.teapot, reasonPhrase: "I'm a teapot"))
            response.headers["Content-Type"] = "application/json"
            response.body = try! Body(JSON(["error": "I'm a teapot"]))
            return response
        }
    }
    
    static var internalServerError: ResponseRepresentable {
        get {
            let response = Response(status: .other(statusCode: StatusCodes.internalServerError, reasonPhrase: "Fuck!"))
            response.headers["Content-Type"] = "application/json"
            response.body = try! Body(JSON(["error": "Internal server error"]))
            return response
        }
    }
    
    static var notImplemented: ResponseRepresentable {
        get {
            let response = Response(status: .other(statusCode: StatusCodes.notImplemented, reasonPhrase: "Stumbling?"))
            response.headers["Content-Type"] = "application/json"
            response.body = try! Body(JSON(["error": "Not implemented"]))
            return response
        }
    }
    
    static var selfHarm: ResponseRepresentable {
        get {
            let response = Response(status: .other(statusCode: StatusCodes.forbidden, reasonPhrase: "Self harming?!"))
            response.headers["Content-Type"] = "application/json"
            response.body = try! Body(JSON(["error": "Don't do this to yourself!"]))
            return response
        }
    }
    
    static var setupLocked: ResponseRepresentable {
        get {
            let response = Response(status: .other(statusCode: StatusCodes.forbidden, reasonPhrase: "Go away!"))
            response.headers["Content-Type"] = "application/json"
            response.body = try! Body(JSON(["error": "Setup has been locked"]))
            return response
        }
    }
    
}
