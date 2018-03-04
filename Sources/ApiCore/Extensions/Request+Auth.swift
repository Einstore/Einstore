//
//  Request+Auth.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 01/03/2018.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL
import DbCore
import ErrorsCore


public struct Me {
    
    let request: Request
    
    init(_ request: Request) {
        self.request = request
    }
    
    public func user() throws -> Future<User> {
        return User.query(on: request).sort(\User.su, .descending).first().map(to: User.self) { (user) -> User in
            guard let user = user else {
                throw AuthError.authenticationFailed
            }
            return user
        }
    }
    
    public func teams() throws -> Future<Teams> {
        return try self.user().flatMap(to: Teams.self) { me in
            return try me.teams.query(on: self.request).all()
        }
    }
    
    public func verifiedTeam(id teamId: DbCoreIdentifier) throws -> Future<Team> {
        return try teams().map(to: Team.self) { teams in
            guard let team = teams.filter({ $0.id == teamId }).first else {
                throw ErrorsCore.HTTPError.notFound
            }
            return team
        }
    }
    
}


extension Request {
    
    public var me: Me {
        return Me(self)
    }
    
}
