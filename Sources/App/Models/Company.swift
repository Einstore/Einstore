//
//  Company.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import Fluent


final class Company: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var name: String
//    var users: [User]?
    
    init(companyId: Int16) {
        self.id = try! companyId.makeNode()
        self.name = "Company name"
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("id")
        self.name = try node.extract("name")
    }
    
    func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "id": self.id,
            "name": self.name
            ])
    }
    
}

extension Company: Preparation {
    
    static func prepare(_ database: Database) throws {
        //
    }
    
    static func revert(_ database: Database) throws {
        //
    }
    
}
