//
//  Team.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor
import DbCore


public final class Team: DbCoreModel {
    
    public var id: ID?
    public var name: String
    public var identifier: String
    
}


extension Team {
    
    public typealias Database = DbCoreDatabase
    public typealias ID = DbCoreIdentifier
    
    public static var idKey = \Team.id
    
//    public static func prepare(on connection: Database.Connection) -> Future<Void> {
//        let userJoinTableName = "\(User.entity)_\(Team.entity)"
//        let query = """
//        CREATE TABLE `\(entity)` (
//            `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
//            `name` varchar(40) NOT NULL,
//            `identifier` varchar(40) NOT NULL
//        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//
//        ALTER TABLE `teams`
//            ADD PRIMARY KEY (`id`),
//            ADD KEY `identifier` (`identifier`);
//
//        INSERT INTO `teams` (`name`, `identifier`) VALUES ('Admin team', 'admin-team');
//
//        CREATE TABLE `\(userJoinTableName)` (
//            `user_id` int(11) UNSIGNED NOT NULL,
//            `team_id` int(11) UNSIGNED NOT NULL
//        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//
//        ALTER TABLE `\(userJoinTableName)`
//                ADD KEY `indexes` (`team_id`, `user_id`);
//
//        ALTER TABLE `\(userJoinTableName)`
//            ADD CONSTRAINT `fk-\(userJoinTableName)-user_id`
//                FOREIGN KEY (`user_id`)
//                REFERENCES `team_id` (`id`)
//                ON DELETE CASCADE
//                ON UPDATE NO ACTION,
//        ADD CONSTRAINT `fk-\(userJoinTableName)-team_id`
//            FOREIGN KEY (`team_id`)
//                REFERENCES `\(Team.entity)` (`id`)
//                ON DELETE CASCADE
//                ON UPDATE NO ACTION;
//
//        INSERT INTO `users_teams` (`user_id`, `team_id`) VALUES ('1', '1');
//
//        COMMIT;
//        """
//        return connection.administrativeQuery(query)
//    }
    
}
