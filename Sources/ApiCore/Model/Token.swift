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
        public var id: ID?
        public var user: User
        public var expires: Date
    }
    
    public var id: ID?
    public var userId: ID
    public var user: User
    public var token: String
    public var expires: Date
    
    init(user: User) throws {
        guard let userId = user.id else {
            throw TokenError.missingUserId
        }
        self.user = user
        self.userId = userId
        self.token = UUID().uuidString
        self.expires = Date().addMonth(n: 1)
    }

}


extension Token.Public {
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \Token.Public.id
    
}


extension Token {
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \Token.id
    
//    public static func prepare(on connection: Database.Connection) -> Future<Void> {
//        return Database.create(self, on: connection) { (schema: SchemaBuilder<Token>) in
//            schema.addField(type: DbCoreColumnType.uint32(length: 11), name: CodingKeys.id.stringValue, isIdentifier: true)
//            schema.addField(type: DbCoreColumnType.uint32(length: 11), name: "user_id")
//            schema.addField(type: DbCoreColumnType.varChar(length: 64), name: CodingKeys.token.stringValue)
//            schema.addField(type: DbCoreColumnType.datetime(), name: CodingKeys.expires.stringValue)
//        }
//    }
    
}

