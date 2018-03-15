//
//  Team.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL
import DbCore
import ErrorsCore


public typealias Teams = [Team]


public final class Team: DbCoreModel {
    
    public enum TeamError: FrontendError {
        case identifierAlreadyExists
        
        public var code: String {
            return "app_error"
        }
        
        public var status: HTTPStatus {
            return .conflict
        }
        
        public var description: String {
            switch self {
            case .identifierAlreadyExists:
                return "Identifier already exists"
            }
        }
        
    }
    
    public var id: DbCoreIdentifier?
    public var name: String
    public var identifier: String
    public var admin: Bool
    
    public init(id: DbCoreIdentifier? = nil, name: String, identifier: String, admin: Bool = false) {
        self.name = name
        self.identifier = identifier
        self.admin = admin
    }
    
}

// MARK: - Migrations

extension Team: Migration {
    
    public struct New: Content {
        public var name: String
        public var identifier: String
    }
    
    public struct Name: Content {
        public var name: String
        
        public init(name: String) {
            self.name = name
        }
    }
    
    public struct Identifier: Content {
        public var identifier: String
        
        public init(identifier: String) {
            self.identifier = identifier
        }
    }
    
    public static var idKey: WritableKeyPath<Team, DbCoreIdentifier?> = \Team.id
    
    public static func prepare(on connection: DbCoreConnection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema) in
            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: DbCoreColumnType.varChar(40), name: CodingKeys.name.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(40), name: CodingKeys.identifier.stringValue)
            schema.addField(type: DbCoreColumnType.bool(), name: CodingKeys.admin.stringValue)
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(Team.self, on: connection)
    }
    
}


extension Team.New: Insertable {

    public typealias T = Team
    
    public var insertable: T {
        return Team(name: name, identifier: identifier.safeText)
    }
    
}

// MARK: - Relationships

extension Team {
    
    public var users: Siblings<Team, User, TeamUser> {
        return siblings()
    }
    
}

// MARK: - Queries

extension Team {
    
    public static func exists(identifier: String, on connection: DatabaseConnectable) throws -> Future<Bool> {
        return try Team.query(on: connection).filter(\Team.identifier == identifier).count().map(to: Bool.self, { (count) -> Bool in
            return count > 0
        })
    }
    
}

// MARK: - Helpers

extension Array where Element == Team {
    
    public var ids: [DbCoreIdentifier] {
        let teamIds = compactMap({ (team) -> DbCoreIdentifier in
            return team.id!
        })
        return teamIds
    }
    
    public func contains(_ teamId: DbCoreIdentifier) -> Bool {
        return ids.contains(teamId)
    }
    
    public func contains(admin: Bool) -> Bool {
        return compactMap({ $0.admin == admin }).count > 0
    }
    
    public var containsAdmin: Bool {
        return contains(admin: true)
    }
    
}
