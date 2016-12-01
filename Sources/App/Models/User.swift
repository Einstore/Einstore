//
//  User.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import Fluent
import HTTP


enum UserType: String {
    case superAdmin = "su"
    case admin = "a"
    case developer = "d"
    case tester = "t"
    case client = "c"
}


final class User: Model {
    
    var exists: Bool = false
    
    var id: Node?
    var type: UserType? = .tester
    var email: String?
    var password: String?
    var firstname: String?
    var lastname: String?
    var company: IdType?
    var phone: String?
    var ims: [String: String]?
    var timezone: Int?
    var token: String?
    var created: Date?
    //var teams: [IdType]?
    
    
    // MARK: Initialization
    
    init() {
        self.created = Date()
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.type = try UserType(rawValue: node.extract("type"))
        self.email = try node.extract("email")
        self.password = try node.extract("password")
        self.firstname = try node.extract("firstname")
        self.lastname = try node.extract("lastname")
        self.company = try node.extract("company_id")
        self.phone = try node.extract("phone")
        self.ims = try node.extract("ims")
        self.timezone = try node.extract("timezone")
        self.token = try node.extract("token")
        self.created = Date.init(timeIntervalSince1970: try node.extract("created"))
        //self.teams = try node.extract("teams")
    }
    
    func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "_id": self.id,
            "type": self.type?.rawValue,
            "email": self.email,
            "password": self.password,
            "firstname": self.firstname,
            "lastname": self.lastname,
            "company_id": self.company,
            "phone": self.phone,
            "ims": self.ims?.makeNode(),
            "timezone": self.timezone?.makeNode(),
            "token": self.token,
            "created": self.created?.timeIntervalSince1970.makeNode(),
            //"teams": self.teams?.makeNode()
            ])
    }
    
}

extension User: Preparation {
    
    static func prepare(_ database: Database) throws {
        
    }
    
    static func revert(_ database: Database) throws {
        
    }
    
}

// MARK: - Helpers

extension User {
    
    // MARK: Get
    
    static func find(email: String, password: String) throws -> User? {
        return try User.query().filter("email", email).filter("password", password).first()
    }
    
    static func find(email: String) throws -> User? {
        return try User.query().filter("email", email).first()
    }
    
    // MARK: Save / update
    
    func update(fromRequest request: Request, forgetPassword: Bool = false) throws {
        if let email = request.data["email"]?.string {
            self.email = email
        }
        if !forgetPassword {
            if let password = request.data["password"]?.string {
                self.password = try drop.hash.make(password)
            }
        }
        if let firstname = request.data["firstname"]?.string {
            self.firstname = firstname
        }
        if let lastname = request.data["lastname"]?.string {
            self.lastname = lastname
        }
        if let phone = request.data["phone"]?.string {
            self.phone = phone
        }
        if var timezone = request.data["timezone"]?.int {
            if timezone < -12 {
                timezone = -12
            }
            else if timezone > 14 {
                timezone = 14
            }
            self.timezone = timezone
        }
        if let rawType = request.data["type"]?.string {
            guard let type = UserType(rawValue: rawType) else {
                return
            }
            if Me.shared.type(min: type) && Me.shared.user?.id != self.id {
                self.type = type
            }
        }
    }
    
}

// MARK: Validation

extension User {
    
    
    static var validationFields: [Field] {
        get {
            var fields: [Field] = self.inviteValidationFields
            
            fields.append(Field(name: "password", validationType: .password, errorMessage: Lang.get("Password needs to be at least six characters long")))
            
            return fields
        }
    }
    
    static var inviteValidationFields: [Field] {
        get {
            var fields: [Field] = []
            
            fields.append(Field(name: "firstname", validationType: .empty, errorMessage: Lang.get("First name can not be empty")))
            fields.append(Field(name: "lastname", validationType: .empty, errorMessage: Lang.get("Last name can not be empty")))
            fields.append(Field(name: "email", validationType: .email, errorMessage: Lang.get("Please provide a valid email")))
            
            return fields
        }
    }
    
}
