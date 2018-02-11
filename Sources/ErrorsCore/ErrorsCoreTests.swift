//
//  ErrorsCore.swift
//  ErrorsCore
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor


public protocol WebError { }


public enum HTTPError: Error, WebError {
    case notAuthorized
    case missingRequestData
    case missingAuthorizationData
}

