//
//  AuthError.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 17/01/2018.
//

import Foundation
import ErrorsCore
import Vapor


public enum AuthError: FrontendError {
    case authenticationFailed
    case serverError
    
    public var code: String {
        return "auth_error"
    }
    
    public var status: HTTPStatus {
        switch self {
        case .authenticationFailed:
            return .unauthorized
        case .serverError:
            return .internalServerError
        }
    }
    
    public var description: String {
        switch self {
        case .authenticationFailed:
            return "Authentication has failed"
        case .serverError:
            return "Server error"
        }
    }
}
