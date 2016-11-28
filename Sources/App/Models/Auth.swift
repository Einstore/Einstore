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
    
    var exists: Bool = false
    
    var id: Node?
    var token: String?
    var created: Date?
    var user: User?
    
    
    // MARK: Initialization
    
    init(user: User) {
        self.token = UUID().uuidString
        self.created = Date()
        self.user = user
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("id")
        self.token = try node.extract("token")
        self.created = try Date(rfc1123: node.extract("created"))
        self.user = try node.extract("user")
    }
    
    func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "id": self.id,
            "token": self.token,
            "created": self.created?.rfc1123,
            "user": self.user
            ])
    }
    
    func makeJSON() throws -> JSON {
        return JSON(["token": (self.token ?? "").makeNode(), "user": try self.user?.makeNode() ?? nil])
    }
    
}

extension Auth: Preparation {
    
    static func prepare(_ database: Database) throws {
        
    }
    
    static func revert(_ database: Database) throws {
        try database.delete("users")
    }
    
}
