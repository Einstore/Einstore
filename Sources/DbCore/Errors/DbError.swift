//
//  DbError.swift
//  DbCore
//
//  Created by Ondrej Rafaj on 14/01/2018.
//

import Foundation
import Vapor
import ErrorsCore


public enum DbError: FrontendError {
    
    case insertFailed
    case updateFailed
    case deleteFailed

    public var code: String {
        return "db_error"
    }
    
    public var status: HTTPStatus {
        return .internalServerError
    }
    
    public var description: String {
        switch self {
        case .insertFailed:
            return "Insert failed"
        case .updateFailed:
            return "Update failed"
        case .deleteFailed:
            return "Delete failed"
        }
    }
    
}
