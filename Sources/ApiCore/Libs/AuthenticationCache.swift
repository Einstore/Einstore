//
//  AuthenticationCache.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 18/01/2018.
//

import Foundation
import Vapor
import DbCore
import JWT

//
//final class UserPayload: JWTPayload {
//
//    func verify() throws {
//
//    }
//
//    let userId: DbCoreIdentifier
//
//    init(_ userId: DbCoreIdentifier) {
//        self.userId = userId
//    }
//
//}


struct JWTAuthPayload: JWTPayload {
    
    var exp: ExpirationClaim
    var userId: UUID
    
    enum CodingKeys: String, CodingKey {
        case exp
        case userId = "user_id"
    }
    
    func verify() throws {
        try exp.verify()
    }
}


final class JWTService: Service {
    
    var signer: JWTSigner
    
    init(secret: String) {
        signer = JWTSigner.hs512(key: Data(secret.utf8))
    }
    
    func signUserToToken(user: User) throws -> String {
//        var jwt = JWT(payload: UserPayload(user.id!))
//        let data = try signer.sign(&jwt)
//        return String(data: data, encoding: .utf8) ?? ""
        
        let exp = ExpirationClaim(value: Date(timeIntervalSinceNow: (60 * 15))) // 15 minutes
        var jwt = JWT(payload: JWTAuthPayload(exp: exp, userId: user.id!))
        
        jwt.header.typ = nil // set to nil to avoid dictionary re-ordering causing probs
        let data = try signer.sign(&jwt)
        
        guard let jwtToken: String = String(data: data, encoding: .utf8) else {
            throw AuthError.serverError
        }
        return jwtToken
    }
    
}


final class AuthenticationCache: Service {
    
    /// The internal storage.
    private var storage: [ObjectIdentifier: Any]
    
    /// Create a new authentication cache.
    init() {
        self.storage = [:]
    }
    
    /// Access the cache using types.
    internal subscript<A>(_ type: A.Type) -> A? {
        get {
            return storage[ObjectIdentifier(A.self)] as? A
        }
        set {
            storage[ObjectIdentifier(A.self)] = newValue
        }
    }
    
}

extension Request {
    
    /// Authenticates the supplied instance for this request.
    public func authenticate<A>(_ instance: A) throws {
        let cache = try privateContainer.make(AuthenticationCache.self, for: Request.self)
        cache[A.self] = instance
    }
    
    /// Returns the authenticated instance of the supplied type.
    /// note: nil if no type has been authed, throws if there is a problem.
    public func authenticated<A>(_ type: A.Type) throws -> A? {
        let cache = try privateContainer.make(AuthenticationCache.self, for: Request.self)
        return cache[A.self]
    }
    
    /// Returns true if the type has been authenticated.
    public func isAuthenticated<A>(_ type: A.Type) throws -> Bool {
        return try authenticated(A.self) != nil
    }
    
    /// Returns an instance of the supplied type. Throws if no
    /// instance of that type has been authenticated or if there
    /// was a problem.
    public func requireAuthenticated<A>(_ type: A.Type) throws -> A {
        guard let auth = try authenticated(A.self) else {
            throw Abort(.unauthorized, reason: "\(A.self) has not been authenticated.")
        }
        return auth
    }
    
}
