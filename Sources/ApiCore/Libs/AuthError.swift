//
//  AuthError.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 17/01/2018.
//

import Foundation
import ApiErrors
import Vapor


enum AuthError: FrontendError {
    case authenticationFailed
    
    public var code: String {
        return "auth_error"
    }
    
    public var status: HTTPStatus {
        return .unauthorized
    }
    
    public var description: String {
        switch self {
        case .authenticationFailed:
            return "Authentication has failed"
        }
    }
}
