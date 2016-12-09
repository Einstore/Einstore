//
//  App.swift
//  Boost
//
//  Created by Ondrej Rafaj on 01/12/2016.
//
//

import Foundation
import Vapor
import Fluent
import HTTP


enum Platform: String {
    case iOS = "iOS"
    case tvOS = "tvOS"
    case simulator = "simulator"
    case android = "android"
    case macOS = "macOS"
}


final class App: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var name: String?
    var iconUrl: String?
    var identifier: String?
    var token: String?
    var platform: Platform?
    var created: Date?
    var users: [IdType]?
    
    
    // MARK: Initialization
    
    init() {
        
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.name = try node.extract("name")
        self.iconUrl = try node.extract("icon")
        self.identifier = try node.extract("identifier")
        self.token = try node.extract("token")
        self.platform = Platform(rawValue: try node.extract("token"))
        self.created = Date.init(timeIntervalSince1970: try node.extract("created"))
        self.users = try node.extract("users")
    }
    
    func makeNode(context: Context) throws -> Node {
        let nodes = try Node(node: [
            "_id": self.id,
            "name": self.name,
            "icon": self.iconUrl,
            "identifier": self.identifier,
            "token": self.token,
            "platform": self.platform?.rawValue,
            "created": self.created?.timeIntervalSince1970.makeNode(),
            "users": self.users?.makeNode()
            ])
        return nodes
    }
    
}

extension App: Preparation {
    
    static func prepare(_ database: Database) throws {
        
    }
    
    static func revert(_ database: Database) throws {
        
    }
    
}

// MARK: - Helpers

extension App {
    
    // MARK: Get
    
    static func find(identifier: String, platform: Platform) throws -> App? {
        return try App.query().filter("identifier", identifier).filter("platform", platform.rawValue).first()
    }
    
    // MARK: Save / update
    
    func update(fromRequest request: Request) throws {
        if let name = request.data["name"]?.string {
            self.name = name
        }
        if let users = request.data["users"]?.array {
            self.users = users as? [IdType]
        }
    }
    
}

// MARK: Validation

extension App {
    
    static var validationFields: [Field] {
        get {
            var fields: [Field] = []
            
            fields.append(Field(name: "name", validationType: .empty, errorMessage: Lang.get("App name can not be empty")))
            
            return fields
        }
    }
    
}
