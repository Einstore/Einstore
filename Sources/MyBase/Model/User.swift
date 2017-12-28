//
//  User.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor
import SQLEncoder


public struct User {
    
    public struct Registration: Content {
        
        public var firstname: String
        public var lastname: String
        public var email: String
        public var password: String
        
    }
    
    public struct Auth: Content {
        
        public let token: String
        public let user: User.Display
        
    }
        
    public struct Login: Content {
        
        public let email: String
        public let password: String
        
    }
    
    public struct Display: Content {
        
        public var id: Int
        public var firstname: String
        public var lastname: String
        public var email: String
        public var expires: Date?
        public var registered: Date
        public var disabled: Bool
        public var su: Bool
        
    }
    
    public struct Save: Content, Manipulation, SQLEncodable {
        
        public static var tableName: String = User.Display.tableName
        
        public var id: Int?
        public var firstname: String
        public var lastname: String
        public var email: String
        public var password: String?
        public var token: String?
        public var expires: Date?
        public var registered: Date
        public var disabled: Bool
        public var su: Bool
        
    }
    
}


extension User.Registration {
    
    var newUser: User.Save {
        let token = UUID().uuidString.passwordHash
        let user = User.Save(id: nil, firstname: firstname, lastname: lastname, email: email, password: password.passwordHash, token: token, expires: nil, registered: Date(), disabled: true, su: false)
        return user
    }
    
}

extension User.Save {
    
    var display: User.Display {
        let user = User.Display(id: id ?? 0, firstname: firstname, lastname: lastname, email: email, expires: expires, registered: registered, disabled: disabled, su: su)
        return user
    }
    
}
