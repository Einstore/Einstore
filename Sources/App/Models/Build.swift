//
//  Build.swift
//  Boost
//
//  Created by Ondrej Rafaj on 07/12/2016.
//
//

import Foundation
import Vapor
import Fluent
import HTTP


final class Build: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var name: String?
    var iconUrl: String?
    var created: Date?
    var data: JSON?
    var app: IdType?
    
    
    // MARK: Initialization
    
    init() {
        
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.name = try node.extract("name")
        self.iconUrl = try node.extract("icon")
        self.data = try node.extract("data")
        self.created = Date.init(timeIntervalSince1970: try node.extract("created"))
        self.app = try node.extract("app")
    }
    
    func makeNode(context: Context) throws -> Node {
        let nodes = try Node(node: [
            "_id": self.id,
            "name": self.name,
            "icon": self.iconUrl,
            "data": self.data,
            "created": self.created?.timeIntervalSince1970,
            "app": self.app
            ])
        return nodes
    }
    
}

extension Build: Preparation {
    
    static func prepare(_ database: Database) throws {
        
    }
    
    static func revert(_ database: Database) throws {
        
    }
    
}

// MARK: - Helpers

extension Build {
    
    // MARK: Get
    
//    static func find(name: String) throws -> Team? {
//        return try Team.query().filter("name", name).first()
//    }
    
    // MARK: Save / update
    
//    func update(fromRequest request: Request) throws {
//        if let name = request.data["name"]?.string {
//            self.name = name
//        }
//        if let users = request.data["users"]?.array {
//            self.users = users as? [IdType]
//        }
//    }
    
}

// MARK: Validation

extension Build {
    
    
    static var validationFields: [Field] {
        get {
            var fields: [Field] = []
            
            fields.append(Field(name: "name", validationType: .empty, errorMessage: Lang.get("App name can not be empty")))
            
            return fields
        }
    }
    
}
