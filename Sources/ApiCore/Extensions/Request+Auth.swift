//
//  Request+Auth.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 01/03/2018.
//

import Foundation
import Vapor


extension Request {
    
    public func me() throws -> Future<User> {
        return User.query(on: self).sort(\User.su, .descending).first().map(to: User.self) { (user) -> User in
            guard let user = user else {
                throw AuthError.authenticationFailed
            }
            return user
        }
    }
    
}
