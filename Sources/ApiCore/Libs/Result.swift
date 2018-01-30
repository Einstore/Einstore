//
//  Result.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 24/01/2018.
//

import Foundation


public enum Result<T> {
    case complete
    case success(T)
    case error(Error)
    
    public var success: Bool {
        switch self {
        case .error(_):
            return false
        default:
            return true
        }
    }
    
    public var error: Error? {
        switch self {
        case .error(let error):
            return error
        default:
            return nil
        }
    }
    
    public var object: T? {
        switch self {
        case .success(let object):
            return object
        default:
            return nil
        }
    }
    
}
