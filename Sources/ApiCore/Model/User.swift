//
//  User.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor
import DbCore


public final class User: DbCoreModel {
    
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
        
        public init?(email: String, password: String) {
            guard email.count > 0, password.count > 0 else {
                return nil
            }
            self.email = email
            self.password = password
        }
    }
    
    public final class Display: DbCoreModel {
        public var id: ID?
        public var firstname: String
        public var lastname: String
        public var email: String
        public var expires: Date?
        public var registered: Date
//        public var disabled: Bool
//        public var su: Bool
    }
    
    public var id: ID?
    public var firstname: String
    public var lastname: String
    public var email: String
    public var password: String?
    public var token: String?
    public var expires: Date?
    public var registered: Date
    public var disabled: Bool
    public var su: Bool
    
    public init(firstname: String, lastname: String, email: String, password: String? = nil, token: String? = nil, expires: Date? = nil, disabled: Bool = true, su: Bool = false) {
        self.firstname = firstname
        self.lastname = lastname
        self.email = email
        self.password = password
        self.token = token
        self.expires = expires
        self.registered = Date()
        self.disabled = disabled
        self.su = su
    }
    
}


extension User.Display {
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \User.Display.id
    
}


extension User {
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \User.id
    
    static var superUser: String {
        let password: String = "admin".passwordHash
        let query = "INSERT INTO `\(entity)` (`firstname`, `lastname`, `email`, `password`, `registered`, `disabled`, `su`) VALUES ('Super', 'Admin', 'admin@liveui.io', '\(password)', NOW(), 0, 1);"
        return query
    }
    
//    public static func prepare(on connection: Database.Connection) -> Future<Void> {
//        let query = """
//        CREATE TABLE `\(entity)` (
//            `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
//            `firstname` varchar(80) NOT NULL,
//            `lastname` varchar(80) NOT NULL,
//            `email` varchar(140) NOT NULL,
//            `password` varchar(64) NOT NULL,
//            `token` varchar(64) NULL,
//            `expires` datetime NULL,
//            `registered` datetime NOT NULL,
//            `disabled` tinyint(1) NOT NULL DEFAULT '1',
//            `su` tinyint(1) NOT NULL DEFAULT '0'
//        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//
//        ALTER TABLE `\(entity)`
//            ADD PRIMARY KEY (`id`),
//            ADD KEY `strings` (`email`,`password`);
//
//        -- Create super user
//        \(superUser)
//
//        COMMIT;
//        """
//        return connection.administrativeQuery(query)
//    }
    
}

