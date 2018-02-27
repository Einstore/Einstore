//
//  HTTPRequest+Make.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import Vapor
import Routing


extension TestableProperty where TestableType == HTTPRequest {
    
    public static func request(method: HTTPMethod, uri: URI, data: Data? = nil, headers: [String: String]? = nil) -> HTTPRequest {
        let req = HTTPRequest(method: method, uri: uri)
        return req
    }
    
    public static func get(uri: URI, headers: [String: String]? = nil) -> HTTPRequest {
        let req = request(method: HTTPMethod.get, uri: uri, headers: headers)
        return req
    }
    
    public static func put(uri: URI, data: Data? = nil, headers: [String: String]? = nil) -> HTTPRequest {
        let req = request(method: HTTPMethod.get, uri: uri, data: data, headers: headers)
        return req
    }
    
    public static func post(uri: URI, data: Data? = nil, headers: [String: String]? = nil) -> HTTPRequest {
        let req = request(method: HTTPMethod.get, uri: uri, data: data, headers: headers)
        return req
    }
    
    public static func path(uri: URI, data: Data? = nil, headers: [String: String]? = nil) -> HTTPRequest {
        let req = request(method: HTTPMethod.get, uri: uri, data: data, headers: headers)
        return req
    }
    
    public static func delete(uri: URI, headers: [String: String]? = nil) -> HTTPRequest {
        let req = request(method: HTTPMethod.get, uri: uri, headers: headers)
        return req
    }
    
}
