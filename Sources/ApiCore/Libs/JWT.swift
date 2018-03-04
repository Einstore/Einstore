//
//  JWT.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 28/02/2018.
//

import Foundation
import JWT

//public class JWTHelper {
//
//    public static func jwtToken(for user: User) throws -> String {
//        let exp = ExpirationClaim(value: Date(timeIntervalSinceNow: (60 * 15))) // 15 minutes
//        var jwt = JWT(payload: JWTAuthPayload(exp: exp, userId: user.id!))
//
//        // TODO: Make the secret SECRET!!!!!!!!!!!!!!!!!!!!
//        let signer = JWTSigner.hs256(key: Data("secret".utf8))
//        jwt.header.typ = nil // set to nil to avoid dictionary re-ordering causing probs
//        let data = try signer.sign(&jwt)
//
//        guard let jwtToken: String = String(data: data, encoding: .utf8) else {
//            throw AuthError.serverError
//        }
//        return jwtToken
//    }
//
//}


