//
//  Setting.swift
//  SettingsCore
//
//  Created by Ondrej Rafaj on 15/03/2018.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL
import DbCore
import ErrorsCore


public typealias Settings = [Setting]


public final class Setting: DbCoreModel {
    
    public var id: DbCoreIdentifier?
    public var name: String
    public var config: String
    
    public init(id: DbCoreIdentifier? = nil, name: String, config: String) {
        self.id = id
        self.name = name
        self.config = config
    }
    
}

// MARK: - Migrations

extension Setting: Migration {
    
    public static var idKey: WritableKeyPath<Setting, DbCoreIdentifier?> = \Setting.id
    
    public static func prepare(on connection: DbCoreConnection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema) in
            schema.field(for: \.id, isIdentifier: true)
            schema.field(for: \.name, type: .varchar, .notNull)
            schema.field(for: \.config, type: .text, .notNull)
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(Setting.self, on: connection)
    }
    
}
