//
//  Token.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 13/01/2018.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL
import DbCore


public typealias Tokens = [Token]


public final class Token: DbCoreModel {
    
    public enum TokenError: Error {
        case missingUserId
    }
    
    public final class Public: DbCoreModel {
        public var id: DbCoreIdentifier?
        public var user: User
        public var expires: Date
    }
    
    public var id: DbCoreIdentifier?
    public var userId: DbCoreIdentifier
    public var token: String
    public var expires: Date
    
    init(user: User) throws {
        guard let userId = user.id else {
            throw TokenError.missingUserId
        }
//        self.user = user
        self.userId = userId
        self.token = UUID().uuidString
        self.expires = Date().addMonth(n: 1)
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case token
        case expires
    }

}


extension Token.Public {
    
    public static var idKey: WritableKeyPath<Token.Public, DbCoreIdentifier?> = \Token.Public.id
    
}

// MARK: - Migrations

extension Token: Migration {
    
    public static var idKey: WritableKeyPath<Token, DbCoreIdentifier?> = \Token.id
    
    public static func prepare(on connection: DbCoreConnection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema) in
            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.userId.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(64), name: CodingKeys.token.stringValue)
            schema.addField(type: DbCoreColumnType.datetime(), name: CodingKeys.expires.stringValue)
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(Token.self, on: connection)
    }
    
}

