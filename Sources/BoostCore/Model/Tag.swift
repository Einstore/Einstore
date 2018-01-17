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
import FluentMySQL


final class Tag: DbCoreModel {
    
    typealias Database = DbCoreDatabase
    typealias ID = DbCoreIdentifier
    
    static var idKey = \Tag.id
    
    var id: ID?
    var name: String
    var identifier: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case identifier
    }
    
    init(id: ID?, name: String, identifier: String) {
        self.id = id
        self.name = name
        self.identifier = identifier
    }
    
}


extension Tag: Migration {
    
    public static func prepare(on connection: Database.Connection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema: SchemaBuilder<Tag>) in
            schema.addField(type: ColumnType.uint64(length: 20), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: ColumnType.varChar(length: 60), name: CodingKeys.name.stringValue)
            schema.addField(type: ColumnType.varChar(length: 60), name: CodingKeys.identifier.stringValue)
        }
    }
    
}
