//
//  App+Queries.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import MyBase
import Vapor


extension App: Queryable {
    
    static var tableName: String = "apps"
    
    static var create: String = """
CREATE TABLE `\(tableName)` (
`id` int(11) NOT NULL,
`value` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    
ALTER TABLE `tags`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `unique` (`value`);
    
ALTER TABLE `tags`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
    
COMMIT;
"""
    
}

