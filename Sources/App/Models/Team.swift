//
//  Team.swift
//  Boost
//
//  Created by Ondrej Rafaj on 30/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import Fluent
import HTTP


final class Team: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var name: String?
    var created: Date?
    var adminTeam: Bool? = false
    var users: [IdType]?
    
    
    // MARK: Initialization
    
    init() {
        
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.name = try node.extract("name")
        self.created = Date.init(timeIntervalSince1970: try node.extract("created"))
        self.adminTeam = try node.extract("admin")
        self.users = try node.extract("users")
    }
    
    func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "_id": self.id,
            "name": self.name,
            "created": self.created?.timeIntervalSince1970.makeNode(),
            "admin": self.adminTeam,
            "users": self.users?.makeNode()
            ])
    }
    
}

extension Team: Preparation {
    
    static func prepare(_ database: Database) throws {
        
    }
    
    static func revert(_ database: Database) throws {
        
    }
    
}

// MARK: - Helpers

extension Team {
    
    // MARK: Get
    
    static func find(name: String) throws -> Team? {
        return try Team.query().filter("name", name).first()
    }
    
    static func exists(id: Node) throws -> Bool {
        let object = try self.find(id)
        return object != nil
    }
    
    static func exists(idString: String) throws -> Bool {
        return try self.exists(id: idString.makeNode())
    }
    
    static func query(forUserId userId: Node) throws -> Fluent.Query<Team> {
        return try self.query().filter("users", Fluent.Filter.Comparison.contains, userId)
    }
    
    static func query(forUser user: User) throws -> Fluent.Query<Team> {
        return try self.query(forUserId: user.id!)
    }
    
    func members() throws -> Fluent.Query<User>? {
        guard let users = self.users else {
            throw BoostError(.noData)
        }
        // BOOST: Fix this query!!!!
        return try User.query().filter("_id", .in, users)
    }
    
    // MARK: Save / update
    
    func update(fromRequest request: Request) throws {
        if let name = request.data["name"]?.string {
            self.name = name
        }
        if let users = request.data["users"]?.array {
            self.users = []
            for user: Polymorphic in users {
                if let userId: String = user.string {
                    guard try User.exists(idString: userId) else {
                        continue
                    }
                    self.users?.append(userId)
                }
            }
        }
    }
    
}

// MARK: Validation

extension Team {
    
    
    static var validationFields: [Field] {
        get {
            var fields: [Field] = []
            
            fields.append(Field(name: "name", validationType: .empty, errorMessage: Lang.get("Team name can not be empty")))
            
            return fields
        }
    }
    
}
