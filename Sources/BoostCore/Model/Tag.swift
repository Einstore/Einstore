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
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \Tag.id
    
    public var id: ID?
    public var name: String
    public var identifier: String
    
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


extension Tag: Migration {
    
    public static func prepare(on connection: Database.Connection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema: SchemaBuilder<Tag>) in
            schema.addField(type: DbCoreColumnType.uint64(length: 20), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: DbCoreColumnType.varChar(length: 60), name: CodingKeys.name.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(length: 60), name: CodingKeys.identifier.stringValue)
        }
    }
    
}
