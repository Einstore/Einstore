//
//  Company.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import Fluent
import HTTP


final class Company: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var name: String?
    var address: String?
    var url: String?
    var phone: String?
    var created: Date?
    var users: [IdType]?
    
    
    // MARK: Initialization
    
    init() {
        
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.name = try node.extract("name")
        self.address = try node.extract("address")
        self.url = try node.extract("url")
        self.phone = try node.extract("phone")
        self.created = Date.init(timeIntervalSince1970: try node.extract("created"))
        self.users = try node.extract("users")
    }
    
    func makeNode(context: Context) throws -> Node {
        let nodes = try Node(node: [
            "_id": self.id,
            "name": self.name,
            "address": self.address,
            "url": self.url,
            "phone": self.phone,
            "created": self.created?.timeIntervalSince1970.makeNode(),
            "users": self.users?.makeNode()
            ])
        return nodes
    }
    
}

extension Company: Preparation {
    
    static func prepare(_ database: Database) throws {
        
    }
    
    static func revert(_ database: Database) throws {
        
    }
    
}

// MARK: - Helpers

extension Company {
    
    // MARK: Get
    
    static func find(name: String) throws -> Team? {
        return try Team.query().filter("name", name).first()
    }
    
    // MARK: Save / update
    
    func update(fromRequest request: Request) throws {
        if let name = request.data["name"]?.string {
            self.name = name
        }
        if let address = request.data["address"]?.string {
            self.address = address
        }
        if let url = request.data["url"]?.string {
            self.url = url
        }
        if let phone = request.data["phone"]?.string {
            self.phone = phone
        }
        if let users = request.data["users"]?.array {
            self.users = users as? [IdType]
        }
    }
    
}

// MARK: Validation

extension Company {
    
    
    static var validationFields: [Field] {
        get {
            var fields: [Field] = []
            
            fields.append(Field(name: "name", validationType: .empty, errorMessage: Lang.get("Company name can not be empty")))
            
            return fields
        }
    }
    
}
