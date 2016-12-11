//
//  UploadToken.swift
//  Boost
//
//  Created by Ondrej Rafaj on 09/12/2016.
//
//

import Foundation
import Vapor
import Fluent
import HTTP


final class UploadToken: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var token: String?
    var created: Date?
    
    
    // MARK: Initialization
    
    init() {
        
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.token = try node.extract("token")
        self.created = Date.init(timeIntervalSince1970: try node.extract("created"))
    }
    
    func makeNode(context: Context) throws -> Node {
        let nodes = try Node(node: [
            "_id": self.id,
            "token": self.token,
            "created": self.created?.timeIntervalSince1970
            ])
        return nodes
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
        if let _ = try UploadToken.query().filter("token", token.lowercased()).first() {
            return true
        }
        return false
    }
    
}

// MARK: Validation

extension UploadToken {
    
    
    static var validationFields: [Field] {
        get {
            let fields: [Field] = []
            return fields
        }
    }
    
}
