//
//  TeamUser.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 01/03/2018.
//

import Foundation
import Fluent
import DbCore
import Vapor


public final class TeamUser: ModifiablePivot, DbCoreModel {
    
    public typealias Left = Team
    public typealias Right = User
    
    public static var leftIDKey: WritableKeyPath<TeamUser, DbCoreIdentifier> {
        return \.teamId
    }
    
    public static var rightIDKey: WritableKeyPath<TeamUser, DbCoreIdentifier> {
        return \.userId
    }
    
    public static var idKey: WritableKeyPath<TeamUser, DbCoreIdentifier?> {
        return \.id
    }
    
    public var id: DbCoreIdentifier?
    public var teamId: DbCoreIdentifier
    public var userId: DbCoreIdentifier
    
    // MARK: Initialization
    
    public init(_ left: TeamUser.Left, _ right: TeamUser.Right) throws {
        teamId = try left.requireID()
        userId = try right.requireID()
    }
    
}

// MARK: - Migrations

extension TeamUser: Migration {
    
    public static func prepare(on connection: DbCoreConnection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema) in
            try schema.field(for: \TeamUser.id)
            try schema.field(for: \TeamUser.teamId)
            try schema.field(for: \TeamUser.userId)
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(TeamUser.self, on: connection)
    }
}
