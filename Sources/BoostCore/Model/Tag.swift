//
//  Tag.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import DbCore
import Vapor
import Fluent
import FluentPostgreSQL


public typealias Tags = [Tag]


final public class Tag: DbCoreModel {
    
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \Tag.id
    
    public var id: ID?
    public var name: String
    public var identifier: String
//    public var apps: [App]
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case identifier
    }
    
    public init(id: ID?, name: String, identifier: String) {
        self.id = id
        self.name = name
        self.identifier = identifier
    }
    
}

// MARK: - Relationships

extension Tag {
    
    var apps: Siblings<Tag, App, AppTag> {
        return siblings()
    }
    
}

// MARK: - Migrations

extension Tag: Migration {
    
    public static func prepare(on connection: DbCoreConnection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema: SchemaBuilder<Tag>) in
            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: DbCoreColumnType.varChar(255), name: CodingKeys.name.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(255), name: CodingKeys.identifier.stringValue)
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(Tag.self, on: connection)
    }
    
}
