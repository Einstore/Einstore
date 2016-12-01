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
    
    static func build<M: Model>(model: M, statusCode: StatusCodes = .success) -> ResponseRepresentable {
        do {
            let status: Status = .other(statusCode: statusCode.rawValue, reasonPhrase: Lang.get("Success"))
            let response: Response = try Response.init(status: status, json: JSON(model.makeNode()))
            return response
        }
        catch {
            return self.internalServerError
        }
    }
    
    static func build(json: JSON, statusCode: StatusCodes = .success) -> ResponseRepresentable {
        do {
            let status: Status = .other(statusCode: statusCode.rawValue, reasonPhrase: Lang.get("Success"))
            let response: Response = try Response.init(status: status, json: json)
            return response
        }
        catch {
            return self.internalServerError
        }
    }
    
    static func build(node: Node, statusCode: StatusCodes = .success) -> ResponseRepresentable {
        do {
            let status: Status = .other(statusCode: statusCode.rawValue, reasonPhrase: Lang.get("Success"))
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
            let status: Status = .other(statusCode: StatusCodes.preconditionNotMet.rawValue, reasonPhrase: Lang.get("Validation error"))
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
    
    static func customErrorResponse(statusCode code: StatusCodes, message: String, bodyMessage: String? = nil) -> ResponseRepresentable {
        let response = Response(status: .other(statusCode: code.rawValue, reasonPhrase: message))
        response.headers["Content-Type"] = "application/json"
        response.body = try! Body(JSON(["error": (bodyMessage != nil ? bodyMessage! : message).makeNode()]))
        return response
    }
    
    static var okNoContent: ResponseRepresentable {
        get {
            return Response(status: .other(statusCode: StatusCodes.successNoData.rawValue, reasonPhrase: Lang.get("Success")))
        }
    }
    
    static var notFound: ResponseRepresentable {
        get {
            return self.customErrorResponse(statusCode: .notFound, message: Lang.get("Not found"))
        }
    }
    
    static var emailExists: ResponseRepresentable {
        get {
            return self.customErrorResponse(statusCode: .notAuthorised, message: Lang.get("Email already registered"))
        }
    }
    
    static var notAuthorised: ResponseRepresentable {
        get {
            return self.customErrorResponse(statusCode: .notAuthorised, message: Lang.get("Not authorised"))
        }
    }
    
    static var actionFailed: ResponseRepresentable {
        get {
            return self.customErrorResponse(statusCode: .forbidden, message: Lang.get("Action failed"))
        }
    }
    
    static var teapot: ResponseRepresentable {
        get {
            return self.customErrorResponse(statusCode: .teapot, message: Lang.get("I'm a teapot"))
        }
    }
    
    static var internalServerError: ResponseRepresentable {
        get {
            return self.customErrorResponse(statusCode: .internalServerError, message: Lang.get("Fuck!"), bodyMessage: Lang.get("Internal server error"))
        }
    }
    
    static var notImplemented: ResponseRepresentable {
        get {
            return self.customErrorResponse(statusCode: .notFound, message: Lang.get("Stumbling?"), bodyMessage: Lang.get("Not implemented"))
        }
    }
    
    static var selfHarm: ResponseRepresentable {
        get {
            return self.customErrorResponse(statusCode: .forbidden, message: Lang.get("Self harming?!"), bodyMessage: Lang.get("Don't do this to yourself!"))
        }
    }
    
    static var setupLocked: ResponseRepresentable {
        get {
            return self.customErrorResponse(statusCode: .forbidden, message: Lang.get("Go away!"), bodyMessage: Lang.get("Setup has been locked"))
        }
    }
    
}
