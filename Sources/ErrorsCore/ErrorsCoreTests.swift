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

public enum HTTPError: Error {
    case notAuthorized
    case missingRequestData
    case missingAuthorizationData
}



