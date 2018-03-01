//
//  ErrorsCore.swift
//  ErrorsCore
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor


// TODO: Change to frontend errors!
public enum GenericError: FrontendError {
    
    case impossibleSituation
    
    public var code: String {
        return "generic"
    }
    
    public var description: String {
        return "This should never, ever happen!"
    }
    
    public var status: HTTPStatus {
        return .internalServerError
    }
    
}

public enum HTTPError: FrontendError {
    case notFound
    case notAuthorized
    case missingRequestData
    case missingAuthorizationData
    
    public var code: String {
        return "http_error"
    }
    
    public var description: String {
        switch self {
        case .notFound:
            return "Not found"
        case .notAuthorized:
            return "Not authorised!!! Boo!"
        case .missingRequestData:
            return "Some request data are missing"
        case .missingAuthorizationData:
            return "Some authorization data are missing"
        }
    }
    
    public var status: HTTPStatus {
        switch self {
        case .notFound:
            return .notFound
        case .notAuthorized:
            return .unauthorized
        case .missingRequestData:
            return .preconditionRequired
        case .missingAuthorizationData:
            return .preconditionRequired
        }
    }
}



