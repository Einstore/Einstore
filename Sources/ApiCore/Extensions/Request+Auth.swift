//
//  Request+Auth.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 17/01/2018.
//

import Foundation
import Vapor
import DbCore

/*
 
 ```final class AuthenticationCache: Service {
    /// The internal storage.
```
step 2, register as singleton:
```        services.register(isSingleton: true) { container in
            return AuthenticationCache()
        }
```
step 3, profit $$$:
```extension Request {
    /// Authenticates the supplied instance for this request.
    public func authenticate<A>(_ instance: A) throws
        where A: Authenticatable
    {
        let cache = try privateContainer.make(AuthenticationCache.self, for: Request.self)
        cache[A.self] = instance
    }```
 
// */


public struct AuthInfo {
    
    let request: Request
    
    init(request: Request) {
        self.request = request
    }
    
    // MARK: Public interface
    
    public func userId() throws -> DbCoreIdentifier {
        return 1
    }
    
    public func teamIds() throws -> [DbCoreIdentifier] {
        return [1]
    }
    
    // MARK: Private helpers
    
    func cache() throws -> AuthenticationCache {
        let cache: AuthenticationCache = try request.privateContainer.make(AuthenticationCache.self, for: Request.self)
        return cache
    }
    
}


extension Request {
    
    public var authInfo: AuthInfo {
        return AuthInfo(request: self)
    }
    
}
