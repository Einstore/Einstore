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
    
    public func user() throws -> User {
        let authenticationCache = try request.make(AuthenticationCache.self, for: Request.self)
        guard let user = authenticationCache[User.self] else {
            throw ErrorsCore.HTTPError.notAuthorized
        }
        return user
    }
    
    public func teams() throws -> Future<Teams> {
        let me = try user()
        return try me.teams.query(on: self.request).all()
    }
    
    public func isAdmin() throws -> Future<Bool> {
        let me = try user()
        return try me.teams.query(on: self.request).all().map(to: Bool.self) { teams in
            return teams.containsAdmin
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

