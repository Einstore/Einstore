//
//  UploadToken.swift
//  Boost
//
//  Created by Ondrej Rafaj on 09/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import Fluent
import HTTP


final class UploadToken: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var token: String?
    var name: String?
    var created: Date?
    var limitedToApps: [IdType]?
    
    // MARK: Initialization
    
    init() {
        
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.token = try node.extract("token")
        self.name = try node.extract("name")
        self.created = Date.init(timeIntervalSince1970: try node.extract("created"))
        self.limitedToApps = try node.extract("apps")
    }
    
    func makeNode(context: Context) throws -> Node {
        let nodes = try Node(node: [
            "_id": self.id,
            "token": self.token,
            "name": self.name,
            "created": self.created?.timeIntervalSince1970,
            "apps": self.limitedToApps?.makeNode()
            ])
        return nodes
    }
    
    func makeJSON() throws -> JSON {
        return try JSON([
            "_id": self.id!,
            "name": self.name!.makeNode(),
            "created": self.created!.timeIntervalSince1970.makeNode(),
            "apps": (self.limitedToApps ?? []).makeNode()
        ].makeNode())
    }
    
}

extension UploadToken: Preparation {
    
    static func prepare(_ database: Database) throws {
        
    }
    
    static func revert(_ database: Database) throws {
        
    }
    
}

// MARK: - Helpers

extension UploadToken {
    
    // MARK: Get
    
    static func exists(token: String) throws -> Bool {
        let hashedToken: String = try drop.hash.make(token.uppercased())
        if let _ = try UploadToken.query().filter("token", hashedToken).first() {
            return true
        }
        return false
    }
    
    // MARK: Save / update
    
    func update(fromRequest request: Request) throws {
        if let name = request.data["name"]?.string {
            self.name = name
        }
        
        if let apps = request.data["apps"]?.array {
            self.limitedToApps = []
            for appId: JSON in apps as! [JSON] {
                if try App.exists(id: appId.makeNode()) {
                    self.limitedToApps?.append(appId.string!)
                }
            }
        }
    }
    
}

// MARK: Validation

extension UploadToken {
    
    
    static var validationFields: [Field] {
        get {
            var fields: [Field] = []
            
            fields.append(Field(name: "name", validationType: .empty, errorMessage: Lang.get("Token name can not be empty")))
            
            return fields
        }
    }
    
}
