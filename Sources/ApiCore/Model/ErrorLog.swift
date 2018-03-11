//
//  Log.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 11/03/2018.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL
import DbCore
import ErrorsCore


public typealias ErrorLogs = [ErrorLog]


public final class ErrorLog: DbCoreModel {
    
    public var id: DbCoreIdentifier?
    public var added: Date
    public var uri: String
    public var method: String
    public var error: String
    
    public init(id: DbCoreIdentifier? = nil, uri: String, method: HTTPMethod, error: Error) {
        self.uri = uri
        self.method = method.string
        self.added = Date()
        
        if let e = error as? FrontendError {
            self.error = "(\(e.code)) \(e.description)"
        }
        else {
            self.error = error.localizedDescription
        }
    }
    
}

// MARK: - Migrations

extension ErrorLog: Migration {
    
    public static var idKey: WritableKeyPath<ErrorLog, DbCoreIdentifier?> = \ErrorLog.id
    
    public static func prepare(on connection: DbCoreConnection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema) in
            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: DbCoreColumnType.datetime(), name: CodingKeys.added.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(250), name: CodingKeys.uri.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(8), name: CodingKeys.method.stringValue)
            schema.addField(type: DbCoreColumnType.text(), name: CodingKeys.error.stringValue)
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(ErrorLog.self, on: connection)
    }
    
}
