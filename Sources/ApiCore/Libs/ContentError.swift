//
//  ContentError.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 17/01/2018.
//

import Foundation
import ApiErrors
import Vapor


enum ContentError: FrontendError {
    case unavailable
    
    public var code: String {
        return "unavailable"
    }
    
    public var status: HTTPStatus {
        return .notFound
    }
    
    public var description: String {
        switch self {
        case .unavailable:
            return "Content uavailable or doesn't exist"
        }
    }
}
