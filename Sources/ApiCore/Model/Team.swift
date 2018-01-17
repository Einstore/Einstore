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


public final class Team: DbCoreModel {
    
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
        public let token: String
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
