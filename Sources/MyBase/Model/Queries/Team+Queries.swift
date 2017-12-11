//
//  Team+Queries.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation


extension Team: Queryable, HasForeignId {
    
    public static var tableName: String = "teams"
    public static var foreignIdName: String = "team_id"
    
    public static var userJoinTableName: String = "\(User.tableName)_\(Team.tableName)"
    
    public static var columns: [String] {
        return [
            "id",
            "name",
            "identifier"
        ]
    }
    
    public static func userJoin(_ count: Bool = false) -> String {
        let what = count ? "COUNT(id)" : columns.joined(separator: ", ")
        return "SELECT \(what) FROM `\(tableName)` RIGHT JOIN `\(userJoinTableName)` ON `\(tableName)`.`id` = `\(userJoinTableName)`.`\(foreignIdName)`"
    }
    
    public static func teams(for userId: Int, count: Bool = false) -> String {
        return "\(userJoin(count)) WHERE `\(userJoinTableName)`.'\(User.foreignIdName)' = \(userId)"
    }
    
    public static var create: String = """
    CREATE TABLE `\(tableName)` (
    `id` int(11) UNSIGNED NOT NULL,
    `name` varchar(40) NOT NULL,
    `identifier` varchar(40) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    
    ALTER TABLE `teams`
        ADD PRIMARY KEY (`id`),
        ADD KEY `identifier` (`identifier`);
    
    ALTER TABLE `teams`
        MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
    
    INSERT INTO `teams` (`name`, `identifier`) VALUES ('Admin team', 'admin-team');
    
    CREATE TABLE `\(userJoinTableName)` (
    `\(User.foreignIdName)` int(11) UNSIGNED NOT NULL,
    `\(Team.foreignIdName)` int(11) UNSIGNED NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    
    ALTER TABLE `\(userJoinTableName)`
        ADD KEY `indexes` (`\(Team.foreignIdName)`, `\(User.foreignIdName)`);
    
    ALTER TABLE `\(userJoinTableName)`
        ADD CONSTRAINT `fk-\(userJoinTableName)-\(User.foreignIdName)`
            FOREIGN KEY (`\(User.foreignIdName)`)
            REFERENCES `\(User.tableName)` (`id`)
            ON DELETE CASCADE
            ON UPDATE NO ACTION,
        ADD CONSTRAINT `fk-\(userJoinTableName)-\(Team.foreignIdName)`
            FOREIGN KEY (`\(Team.foreignIdName)`)
            REFERENCES `\(Team.tableName)` (`id`)
            ON DELETE CASCADE
            ON UPDATE NO ACTION;
    
    INSERT INTO `users_teams` (`user_id`, `team_id`) VALUES ('1', '1');
    
    COMMIT;
    """
    
}
