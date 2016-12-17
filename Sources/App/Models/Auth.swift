//
//  Auth.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import Fluent


final class Auth: Model {
    
    static var entity = "auth"
    
    var exists: Bool = false
    
    var id: Node?
    var token: String?
    var created: Date?
    var userId: Node?
    var user: User?
    
    
    // MARK: Initialization
    
    init(user: User) {
        self.token = UUID().uuidString
        self.created = Date()
        self.user = user
        self.userId = self.user?.id
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.token = try node.extract("token")
        self.created = try Date(rfc1123: node.extract("created"))
        
        self.userId = try node.extract("user")
        let user = try User.query().filter("user", self.userId!).first()
        self.user = user
    }
    
    func makeNode(context: Context) throws -> Node {
        // It's important we only save a hashed token to the DB
        let tokenHash = try drop.hash.make(self.token!)
        return try Node(node: [
            "_id": self.id,
            "token": tokenHash,
            "created": self.created?.rfc1123,
            "user": self.userId
            ])
    }
    
    func makeJSON() throws -> JSON {
        let user: User = self.user!
        user.password = nil
        return JSON(["access_token": self.token!.makeNode(), "user": try user.makeNode()])
    }
    
}

extension Auth: Preparation {
    
    static func prepare(_ database: Database) throws {
        
    }
    
    static func revert(_ database: Database) throws {
        try database.delete("users")
    }
    
}


// MARK: - Helpers

extension Auth {
    
    // MARK: Get
    
    static func find(tokenString token: String) throws -> Auth? {
        let hashedToken: String = try drop.hash.make(token)
        return try self.find(hashedTokenString: hashedToken)
    }
    
    static func find(token: Node) throws -> Auth? {
        let hashedToken: String = try drop.hash.make(token.string ?? "")
        return try self.find(hashedTokenString: hashedToken)
    }
    
    static func find(hashedTokenString token: String) throws -> Auth? {
        return try Auth.query().filter("token", token).first()
    }
    
    static func find(hashedToken token: Node) throws -> Auth? {
        return try Auth.query().filter("token", token).first()
    }
    
    // MARK: Delete
    
    static func delete(userId id: Node) throws {
        try Auth.query().filter("user_id", id).delete()
    }
    
    static func delete(token: String) throws {
        try Auth.query().filter("token", token).delete()
    }
    
}
