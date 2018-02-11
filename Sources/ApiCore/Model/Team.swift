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
        case teamDoesntExist
        
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
            case .teamDoesntExist:
                return "Team doesn't exist"
            }
        }
        
    }
    
    public var id: ID?
    public var name: String
    public var identifier: String
    
    public init(id: ID? = nil, name: String, identifier: String) {
        self.name = name
        self.identifier = identifier
    }
    
}


extension Team {
    
    public struct New: Content {
        public var name: String
        public var identifier: String
    }
    
    public struct Identifier: Content {
        public var identifier: String
    }
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \Team.id
    
//    public static func prepare(on connection: Database.Connection) -> Future<Void> {
//        return Database.create(self, on: connection) { (schema: SchemaBuilder<Team>) in
//            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.id.stringValue, isIdentifier: true)
//            schema.addField(type: DbCoreColumnType.varChar(40), name: CodingKeys.name.stringValue)
//            schema.addField(type: DbCoreColumnType.varChar(40), name: CodingKeys.identifier.stringValue)
//        }
//    }
    
}


extension Team.New: Insertable {

    public typealias T = Team
    
    public var insertable: T {
        return Team(name: name, identifier: identifier.safeText)
    }
    
}


extension Team {
    
    public static func exists(identifier: String, on db: DbCoreDatabase.Connection) -> Future<Bool> {
        return Team.query(on: db).filter(\Team.identifier == identifier).count().map(to: Bool.self, { (count) -> Bool in
            return count > 0
        })
    }
    
    public static func verifiedTeamQuery(connection db: Database.Connection, id: DbCoreIdentifier) throws -> QueryBuilder<Team> {
//        let teams = try req.authInfo.teamIds()
//        return Team.query(on: req).filter(\Team.id == id).filter(\Team.id, in: teams)
        return Team.query(on: db).filter(\Team.id == id)
    }
    
    public static func verifiedTeam(connection db: Database.Connection, id: DbCoreIdentifier) throws -> Future<Team> {
        return try verifiedTeamQuery(connection: db, id: id).first().map(to: Team.self, { (team) -> Team in
            guard let team = team else {
                throw ContentError.unavailable
            }
            return team
        })
    }
    
}
