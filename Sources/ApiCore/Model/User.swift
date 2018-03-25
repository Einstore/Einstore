//
//  User.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL
import DbCore


public typealias Users = [User]


public final class User: DbCoreModel {
    
    public struct Registration: Content {
        
        public struct Template: Codable {
            public var verification: String
            public var serverLink: String
            public var user: Registration
        }
        
        public var username: String
        public var firstname: String
        public var lastname: String
        public var email: String
        public var password: String
        
        public func newUser(on req: Request) throws -> User {
            let user = try User(username: username, firstname: firstname, lastname: lastname, email: email, verification: UUID().uuidString, password: password.passwordHash(req), token: nil, expires: nil, disabled: false, su: false)
            return user
        }
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
        
    }
    
    public final class Display: Content {
        
        public var id: DbCoreIdentifier?
        public var username: String
        public var firstname: String
        public var lastname: String
        public var email: String
        public var expires: Date?
        public var registered: Date
        public var disabled: Bool
        public var su: Bool
        
        public init(username: String, firstname: String, lastname: String, email: String, expires: Date? = nil, disabled: Bool = true, su: Bool = false) {
            self.username = username
            self.firstname = firstname
            self.lastname = lastname
            self.email = email
            self.expires = expires
            self.registered = Date()
            self.disabled = disabled
            self.su = su
        }
        
        public init(_ user: User) {
            self.id = user.id
            self.username = user.username
            self.firstname = user.firstname
            self.lastname = user.lastname
            self.email = user.email
            self.expires = user.expires
            self.registered = user.registered
            self.disabled = user.disabled
            self.su = user.su
        }
        
    }
    
    public final class AllSearch: Content {
        
        public var id: DbCoreIdentifier?
        public var username: String
        public var firstname: String
        public var lastname: String
        public var avatar: String
        public var registered: Date
        public var disabled: Bool
        public var su: Bool
        
        required public init(user: User) {
            id = user.id
            username = user.username
            firstname = user.firstname
            // TODO: Obscure lastname if needed!!!
            lastname = user.lastname
            registered = user.registered
            disabled = user.disabled
            su = user.su
            
            let email = user.email
            avatar = email.imageUrlFromMail
        }
        
    }
    
    public struct Id: Content {
        public var id: DbCoreIdentifier?
        
        public init(id: DbCoreIdentifier) {
            self.id = id
        }
    }
    
    public var id: DbCoreIdentifier?
    public var username: String
    public var firstname: String
    public var lastname: String
    public var email: String
    public var verification: String?
    public var password: String?
    public var token: String?
    public var expires: Date?
    public var registered: Date
    public var disabled: Bool
    public var su: Bool
    
    public init(username: String, firstname: String, lastname: String, email: String, verification: String? = nil, password: String? = nil, token: String? = nil, expires: Date? = nil, disabled: Bool = true, su: Bool = false) {
        self.username = username
        self.firstname = firstname
        self.lastname = lastname
        self.email = email
        self.verification = verification
        self.password = password
        self.token = token
        self.expires = expires
        self.registered = Date()
        self.disabled = disabled
        self.su = su
    }
    
}


extension User.Display {
    
    public static var idKey: WritableKeyPath<User.Display, DbCoreIdentifier?> = \User.Display.id
    
}

// MARK: - Relationships

extension User {
    
    public var teams: Siblings<User, Team, TeamUser> {
        return siblings()
    }
    
}

// MARK: - Queries

extension User {
    
    public static func with(id: DbCoreIdentifier, on connectable: DatabaseConnectable) throws -> Future<User?> {
        return try User.query(on: connectable).filter(\User.id == id).first()
    }
    
}

// MARK: - Migrations

extension User: Migration {
    
    public static var idKey: WritableKeyPath<User, DbCoreIdentifier?> = \User.id
    
    public static func prepare(on connection: DbCoreConnection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema) in
            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: DbCoreColumnType.varChar(80), name: CodingKeys.username.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(80), name: CodingKeys.firstname.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(140), name: CodingKeys.lastname.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(141), name: CodingKeys.email.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(64), name: CodingKeys.verification.stringValue, isOptional: true)
            schema.addField(type: DbCoreColumnType.varChar(64), name: CodingKeys.password.stringValue, isOptional: true)
            schema.addField(type: DbCoreColumnType.varChar(64), name: CodingKeys.token.stringValue, isOptional: true)
            schema.addField(type: DbCoreColumnType.datetime(), name: CodingKeys.expires.stringValue, isOptional: true)
            schema.addField(type: DbCoreColumnType.datetime(), name: CodingKeys.registered.stringValue)
            schema.addField(type: DbCoreColumnType.bool(), name: CodingKeys.disabled.stringValue)
            schema.addField(type: DbCoreColumnType.bool(), name: CodingKeys.su.stringValue)
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(User.self, on: connection)
    }
    
}


extension User {
    
    public func asDisplay() -> User.Display {
        return User.Display(self)
    }
    
}
