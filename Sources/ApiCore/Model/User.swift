//
//  User.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor
import Fluent
import FluentMySQL
import DbCore


public final class User: DbCoreModel {
    
    public struct Registration: Content {
        public var firstname: String
        public var lastname: String
        public var email: String
        public var password: String
    }
    
    public struct Auth {
        
        public struct Login: Content {
            public let email: String
            public let password: String
            
            public init?(email: String, password: String) {
                guard email.count > 0, password.count > 0 else {
                    return nil
                }
                self.email = email
                self.password = password
            }
        }
        
        public struct Token: Content {
            public let token: String
        }
        
        public let twt: String
        public let user: User.Display
    }
    
    public final class Display: DbCoreModel {
        
        public static let entity: String = "users"
        public static let name: String = "users"
        
        public var id: ID?
        public var firstname: String
        public var lastname: String
        public var email: String
        public var expires: Date?
        public var registered: Date
        public var disabled: Bool
        public var su: Bool
    }
    
    public var id: ID?
    public var firstname: String
    public var lastname: String
    public var email: String
    public var password: String?
    public var token: String?
    public var expires: Date?
    public var registered: Date
    public var disabled: Bool
    public var su: Bool
    
    public init(firstname: String, lastname: String, email: String, password: String? = nil, token: String? = nil, expires: Date? = nil, disabled: Bool = true, su: Bool = false) {
        self.firstname = firstname
        self.lastname = lastname
        self.email = email
        self.password = password
        self.token = token
        self.expires = expires
        self.registered = Date()
        self.disabled = disabled
        self.su = su
    }
    
}


extension User.Display {
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \User.Display.id
    
}


extension User {
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \User.id
    
    public static func prepare(on connection: Database.Connection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema: SchemaBuilder<User>) in
            schema.addField(type: ColumnType.uint32(length: 11), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: ColumnType.varChar(length: 80), name: CodingKeys.firstname.stringValue)
            schema.addField(type: ColumnType.varChar(length: 80), name: CodingKeys.lastname.stringValue)
            schema.addField(type: ColumnType.varChar(length: 140), name: CodingKeys.email.stringValue)
            schema.addField(type: ColumnType.varChar(length: 64), name: CodingKeys.password.stringValue)
            schema.addField(type: ColumnType.varChar(length: 64), name: CodingKeys.token.stringValue)
            schema.addField(type: ColumnType.datetime(), name: CodingKeys.expires.stringValue)
            schema.addField(type: ColumnType.datetime(), name: CodingKeys.registered.stringValue)
            schema.addField(type: ColumnType.uint8(length: 1), name: CodingKeys.disabled.stringValue)
            schema.addField(type: ColumnType.uint8(length: 1), name: CodingKeys.su.stringValue)
        }
    }
    
}

