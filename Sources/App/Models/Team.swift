//
//  Team.swift
//  Boost
//
//  Created by Ondrej Rafaj on 30/11/2016.
//
//

import Vapor
import Fluent
import HTTP


final class Team: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var name: String?
    var users: [IdType]?
    
    
    // MARK: Initialization
    
    init() {
        
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.name = try node.extract("name")
        self.users = try node.extract("users")
    }
    
    func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "_id": self.id,
            "name": self.name,
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
    
    // MARK: Save / update
    
    func update(fromRequest request: Request) throws {
        if let name = request.data["name"]?.string {
            self.name = name
        }
    }
    
}

// MARK: Validation

extension Team {
    
    
    static var validationFields: [Field] {
        get {
            var fields: [Field] = []
            
            fields.append(Field(name: "name", validationType: .empty, errorMessage: "Team name can not be empty"))
            
            return fields
        }
    }
    
}
