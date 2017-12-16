//
//  MyErrors.swift
//  MyErrors
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor


public protocol WebError { }


public enum MyHTTPError: Error, WebError {
    case notAuthorized
    case missingRequestData
    case missingAuthorizationData
}

