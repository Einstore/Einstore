//
//  Response+Checks.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
@testable import Vapor


extension TestableProperty where TestableType: Response {
    
    public func has(header name: HTTPHeaderName, value: String? = nil) -> Bool {
        guard let header = header(name: name) else {
            return false
        }
        
        if let value = value {
            return header == value
        }
        else {
            return true
        }
    }
    
    public func has(header name: String, value: String? = nil) -> Bool {
        let headerName = HTTPHeaderName(name)
        return has(header: headerName, value: value)
    }
    
    public func has(contentType value: String) -> Bool {
        let headerName = HTTPHeaderName("Content-Type")
        return has(header: headerName, value: value)
    }
    
    public func has(contentLength value: Int) -> Bool {
        let headerName = HTTPHeaderName("Content-Length")
        return has(header: headerName, value: String(value))
    }
    
    public func has(statusCode value: Int) -> Bool {
        let status = HTTPStatus(code: value)
        return has(statusCode: status)
    }
    
    public func has(statusCode value: Int, message: String) -> Bool {
        return element.http.status.code == value && element.http.status.message == message
    }
    
    public func has(statusCode value: HTTPStatus) -> Bool {
        return element.http.status.code == value.code
    }
    
    public func has(content value: String) -> Bool {
        return contentString == value
    }
    
}
