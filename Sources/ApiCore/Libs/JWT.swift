//
//  JWT.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 28/02/2018.
//

import Foundation
import JWT

public class JWTHelper {
    
    static func jwtToken(for user: User) throws -> String {
        let exp = ExpirationClaim(value: Date(timeIntervalSinceNow: (60 * 5))) // 5 minutes
        var jwt = JWT(payload: JWTAuthPayload(exp: exp, userId: user.id?.uuidString ?? ""))
        
        // TODO: Make the secret SECRET!!!!!!!!!!!!!!!!!!!!
        let signer = JWTSigner.hs256(key: Data("secret".utf8))
        jwt.header.typ = nil // set to nil to avoid dictionary re-ordering causing probs
        let data = try signer.sign(&jwt)
        
        guard let jwtToken: String = String(data: data, encoding: .utf8) else {
            throw AuthError.serverError
        }
        return jwtToken
    }
    
}

struct JWTAuthPayload: JWTPayload {
    
    var exp: ExpirationClaim
    var userId: String
    
    enum CodingKeys: String, CodingKey {
        case exp
        case userId = "user_id"
    }
    
    func verify() throws {
        try exp.verify()
    }
}
