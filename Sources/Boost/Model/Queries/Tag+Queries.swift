//
//  Tag+Queries.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import MyBase
import Vapor


extension Tag: Selectable, HasForeignId {
    
    static var tableName: String = "tags"
    static var foreignIdName: String = "tag_id"
    
    static var create: String = """
CREATE TABLE `\(tableName)` (
    `id` int(11) UNSIGNED NOT NULL,
    `value` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `tags`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `unique` (`value`);

ALTER TABLE `tags`
    MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
    
COMMIT;
"""
    
}

