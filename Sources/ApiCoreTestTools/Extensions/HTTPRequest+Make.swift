//
//  HTTPRequest+Make.swift
//  ApiCoreTestTools
//
//  Created by Ondrej Rafaj on 05/03/2018.
//

import Foundation
import Vapor
@testable import ApiCore
import VaporTestTools

extension TestableProperty where TestableType == HTTPRequest {
    
    public static func get(uri: URI, headers: [String: String]? = nil, authorizedUser user: User, on app: Application) -> HTTPRequest {
        var headers = headers ?? [:]
        
        let jwtService = try! app.make(JWTService.self)
        headers["Authorization"] = try! "Bearer \(jwtService.signUserToToken(user: user))"
        
        let req = get(uri: uri, headers: headers)
        return req
    }
    
    public static func post(uri: URI, data: Data? = nil, headers: [String: String]? = nil, authorizedUser user: User, on app: Application) -> HTTPRequest {
        var headers = headers ?? [:]
        
        let jwtService = try! app.make(JWTService.self)
        headers["Authorization"] = try! "Bearer \(jwtService.signUserToToken(user: user))"
        
        let req = post(uri: uri, data: data, headers: headers)
        return req
    }
    
    public static func put(uri: URI, data: Data? = nil, headers: [String: String]? = nil, authorizedUser user: User, on app: Application) -> HTTPRequest {
        var headers = headers ?? [:]
        
        let jwtService = try! app.make(JWTService.self)
        headers["Authorization"] = try! "Bearer \(jwtService.signUserToToken(user: user))"
        
        let req = put(uri: uri, data: data, headers: headers)
        return req
    }
    
    public static func patch(uri: URI, data: Data? = nil, headers: [String: String]? = nil, authorizedUser user: User, on app: Application) -> HTTPRequest {
        var headers = headers ?? [:]
        
        let jwtService = try! app.make(JWTService.self)
        headers["Authorization"] = try! "Bearer \(jwtService.signUserToToken(user: user))"
        
        let req = patch(uri: uri, data: data, headers: headers)
        return req
    }
    
    public static func delete(uri: URI, headers: [String: String]? = nil, authorizedUser user: User, on app: Application) -> HTTPRequest {
        var headers = headers ?? [:]
        
        let jwtService = try! app.make(JWTService.self)
        headers["Authorization"] = try! "Bearer \(jwtService.signUserToToken(user: user))"
        
        let req = delete(uri: uri, headers: headers)
        return req
    }
    
}

