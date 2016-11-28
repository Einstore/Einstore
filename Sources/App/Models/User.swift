//
//  User.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import Fluent


enum UserType: String {
    case superAdmin = "su"
    case admin = "a"
    case developer = "d"
    case tester = "t"
}


final class User: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var type: UserType?
    var email: String?
    var password: String?
    var firstname: String?
    var lastname: String?
    var company: Company?
    var phone: String?
    //var ims: [String: String]?
    var timezone: Int?
    
    
    // MARK: Initialization
    
    init() {
        
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("id")
        self.type = try UserType(rawValue: node.extract("type"))
        self.email = try node.extract("email")
        self.password = try node.extract("password")
        self.firstname = try node.extract("firstname")
        self.lastname = try node.extract("lastname")
        self.company = try node.extract("company")
        self.phone = try node.extract("phone")
        //self.ims = try node.extract("ims")
        self.timezone = try node.extract("timezone")
    }
    
    func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "id": self.id,
            "type": self.type?.rawValue,
            "email": self.email,
            "password": self.password,
            "firstname": self.firstname,
            "lastname": self.lastname,
            "company": self.company,
            "phone": self.phone,
            //"ims": self.ims,
            "timezone": self.timezone?.makeNode()
            ])
    }
    
}

extension User: Preparation {
    
    static func prepare(_ database: Database) throws {
        
    }
    
    static func revert(_ database: Database) throws {
        
    }
    
}
