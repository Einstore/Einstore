//
//  Token.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 13/01/2018.
//

import Foundation
import Vapor
import DbCore


public final class Token: DbCoreModel {
    
    public enum TokenError: Error {
        case missingUserId
    }
    
    public final class Public: DbCoreModel {
        public var id: ID?
        public var user: User
        public var expires: Date
    }
    
    public var id: ID?
    public var userId: ID
    public var user: User
    public var token: String
    public var expires: Date
    
    init(user: User) throws {
        guard let userId = user.id else {
            throw TokenError.missingUserId
        }
        self.user = user
        self.userId = userId
        self.token = UUID().uuidString
        self.expires = Date().addMonth(n: 1)
    }

}


extension Token.Public {
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \Token.Public.id
    
}


extension Token {
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \Token.id
    
//    public static func prepare(on connection: Database.Connection) -> Future<Void> {
//        let query = """
//        CREATE TABLE `\(entity)` (
//          `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
//          `user_id` int(11) UNSIGNED NOT NULL,
//          `token` varchar(64) NOT NULL,
//          `expires` datetime NOT NULL
//        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//
//        ALTER TABLE `\(entity)`
//            ADD CONSTRAINT `user_id` FOREIGN KEY (`id`) REFERENCES `\(User.entity)` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
//
//        COMMIT;
//        """
//        return connection.administrativeQuery(query)
//    }
    
}

