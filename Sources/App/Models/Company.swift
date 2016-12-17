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
    
    static var entity = "companies"
    
    var exists: Bool = false
    
    var id: Node?
    var name: String?
    var address: String?
    var url: String?
    var phone: String?
    var created: Date?
    var users: [IdType]?
    
    var logoName: String?
    
    var mainColor: String?
    var mainFontColor: String?
    
    var secondaryColor: String?
    var secondaryFontColor: String?
    
    var backgroundColor: String?
    var contentFontColor: String?
    
    
    // MARK: Initialization
    
    init() {
        
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.name = try node.extract("name")
        self.address = try node.extract("address")
        self.logoName = try node.extract("logo")
        self.url = try node.extract("url")
        self.phone = try node.extract("phone")
        
        self.mainColor = try node.extract("maincolor")
        self.mainFontColor = try node.extract("mainfontcolor")
        self.secondaryColor = try node.extract("secondarycolor")
        self.secondaryFontColor = try node.extract("secondaryfontcolor")
        self.backgroundColor = try node.extract("backgroundcolor")
        self.contentFontColor = try node.extract("contentfontcolor")
        
        self.created = Date.init(timeIntervalSince1970: try node.extract("created"))
        self.users = try node.extract("users")
    }
    
    func makeNode(context: Context) throws -> Node {
        let nodes = try Node(node: [
            "_id": self.id,
            "name": self.name,
            "address": self.address,
            "logo": self.logoName,
            "url": self.url,
            "phone": self.phone,
            
            "maincolor": self.mainColor,
            "mainfontcolor": self.mainFontColor,
            "secondarycolor": self.secondaryColor,
            "secondaryfontcolor": self.secondaryFontColor,
            "backgroundcolor": self.backgroundColor,
            "contentfontcolor": self.contentFontColor,
            
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
    
    static func exists(id: Node) throws -> Bool {
        let object = try self.find(id)
        return object != nil
    }
    
    static func exists(idString: String) throws -> Bool {
        return try self.exists(id: idString.makeNode())
    }
    
    // MARK: Save / update
    
    func update(fromRequest request: Request) throws {
        if let value = request.data["name"]?.string {
            self.name = value
        }
        if let value = request.data["address"]?.string {
            self.address = value
        }
        if let value = request.data["url"]?.string {
            self.url = value
        }
        if let value = request.data["phone"]?.string {
            self.phone = value
        }
        if let value = request.data["maincolor"]?.string {
            self.mainColor = value
        }
        if let value = request.data["mainfontcolor"]?.string {
            self.mainFontColor = value
        }
        if let value = request.data["secondarycolor"]?.string {
            self.secondaryColor = value
        }
        if let value = request.data["secondaryfontcolor"]?.string {
            self.secondaryFontColor = value
        }
        if let value = request.data["backgroundcolor"]?.string {
            self.backgroundColor = value
        }
        if let value = request.data["contentfontcolor"]?.string {
            self.contentFontColor = value
        }
        if let users = request.data["users"]?.array {
            self.users = []
            for objectId: JSON in users as! [JSON] {
                if try User.exists(id: objectId.node) {
                    self.users?.append(objectId.string!)
                }
            }
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
