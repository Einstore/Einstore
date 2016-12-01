//
//  StatusCodes.swift
//  Boost
//
//  Created by Ondrej Rafaj on 29/11/2016.
//
//

import Foundation


enum StatusCodes: Int {
    case success = 200
    case created = 201
    case successNoData = 204
    case notAuthorised = 401
    case forbidden = 403
    case notFound = 404
    case preconditionNotMet = 412
    case teapot = 418
    case internalServerError = 500
    case notImplemented = 501
}
