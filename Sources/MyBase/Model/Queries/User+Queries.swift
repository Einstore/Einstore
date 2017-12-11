//
//  User+Queries.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation


extension User: Queryable, HasForeignId {
    
    public static var tableName: String = "users"
    public static var foreignIdName: String = "user_id"
    
    public static func login(with login: String, password: String) -> String {
        let login = sanitize(login)
        let password = sanitize(password)
        return "SELECT * FROM \(tableName) WHERE (`username` == '\(login)' OR `email` == '\(login)') AND `password` == '\(password)';"
    }
    
    public static var create: String = """
    CREATE TABLE `\(tableName)` (
    `id` int(11) UNSIGNED NOT NULL,
    `username` varchar(30) NOT NULL,
    `firstname` varchar(80) NOT NULL,
    `lastname` varchar(80) NOT NULL,
    `email` varchar(140) NOT NULL,
    `password` varchar(64) NOT NULL,
    `registered` datetime NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    
    ALTER TABLE `users`
        ADD PRIMARY KEY (`id`),
        ADD KEY `strings` (`username`,`email`,`password`);
    
    ALTER TABLE `users`
        MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
    
    INSERT INTO `users` (`username`, `firstname`, `lastname`, `email`, `password`, `registered`) VALUES ('admin', 'Super', 'Admin', 'admin@liveui.io', 'exploited', NOW());
    
    COMMIT;
    """
    
}
