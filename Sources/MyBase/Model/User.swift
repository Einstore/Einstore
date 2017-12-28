//
//  User.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor


public struct User {
    
    public struct Registration: Content {
        public var firstname: String
        public var lastname: String
        public var email: String
        public var password: String
    }
    
    public struct Auth: Content {
        public let token: String
        public let twt: String
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
    
    public struct Save: Content {
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
