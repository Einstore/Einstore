//
//  Team.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor
import Fluent
import FluentMySQL
import DbCore
import ApiErrors


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
    
    public var id: ID?
    public var name: String
    public var identifier: String
    
    public init(name: String, identifier: String) {
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
    
    public static func prepare(on connection: Database.Connection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema: SchemaBuilder<Team>) in
            schema.addField(type: ColumnType.uint32(length: 11), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: ColumnType.varChar(length: 40), name: CodingKeys.name.stringValue)
            schema.addField(type: ColumnType.varChar(length: 40), name: CodingKeys.identifier.stringValue)
        }
    }
    
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
    
    public static func verifiedTeamQuery(request req: Request, id: DbCoreIdentifier) throws -> QueryBuilder<Team> {
//        let teams = try req.authInfo.teamIds()
//        return Team.query(on: req).filter(\Team.id == id).filter(\Team.id, in: teams)
        return Team.query(on: req).filter(\Team.id == id)
    }
    
    public static func verifiedTeam(request req: Request, id: DbCoreIdentifier) throws -> Future<Team> {
        return try verifiedTeamQuery(request: req, id: id).first().map(to: Team.self, { (team) -> Team in
            guard let team = team else {
                throw ContentError.unavailable
            }
            return team
        })
    }
    
}
