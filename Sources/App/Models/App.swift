//
//  App.swift
//  Boost
//
//  Created by Ondrej Rafaj on 01/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import Fluent
import HTTP


enum Platform: String {
    case iOS = "iOS"
    case tvOS = "tvOS"
    case simulator = "Simulator"
    case android = "Android"
    case macOS = "macOS"
    case windows = "Windows"
}


final class App: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var name: String?
    var identifier: String?
    var token: String?
    var platform: Platform?
    var created: Date?
    var modified: Date?
    var latest: Date?
    var availableToAll: Bool = false
    var users: [IdType]?
    
    
    // MARK: Initialization
    
    init() {
        
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.name = try node.extract("name")
        self.identifier = try node.extract("identifier")
        self.token = try node.extract("token")
        self.platform = Platform(rawValue: try node.extract("platform"))
        self.created = Date.init(timeIntervalSince1970: try node.extract("created"))
        self.modified = Date.init(timeIntervalSince1970: try node.extract("modified"))
        self.latest = Date.init(timeIntervalSince1970: try node.extract("latest"))
        self.availableToAll = try node.extract("all") ?? false
        self.users = try node.extract("users")
    }
    
    func makeNode(context: Context) throws -> Node {
        let nodes = try Node(node: [
            "_id": self.id,
            "name": self.name,
            "identifier": self.identifier,
            "token": self.token,
            "platform": self.platform?.rawValue,
            "created": self.created?.timeIntervalSince1970.makeNode(),
            "modified": self.modified?.timeIntervalSince1970.makeNode(),
            "latest": self.latest?.timeIntervalSince1970.makeNode(),
            "all": self.availableToAll,
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
    
    func builds(_ limit: Int = 20, offset: Int = 0) throws -> Fluent.Query<Build> {
        guard let id: String = self.id?.string else {
            throw BoostError(.missingId)
        }
        let query: Fluent.Query = try Build.query().filter("app", id)
        query.limit = Limit(count: limit, offset: offset)
        return try query.sort("created", .ascending)
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
        if let name = request.data["name"]?.string {
            self.name = name
        }
        if let all = request.data["all"]?.bool {
            self.availableToAll = all
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

extension App {
    
    static var validationFields: [Field] {
        get {
            var fields: [Field] = []
            
            fields.append(Field(name: "name", validationType: .empty, errorMessage: Lang.get("App name can not be empty")))
            
            return fields
        }
    }
    
}
