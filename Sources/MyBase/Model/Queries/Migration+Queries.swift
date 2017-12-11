//
//  Migration+Queries.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation


extension Migration: Queryable {
    
    public static var tableName: String = "migrations"
    
    public static var create: String = """
CREATE TABLE `\(tableName)` (
  `id` int(11) UNSIGNED NOT NULL,
  `query` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    
ALTER TABLE `migrations`
    ADD PRIMARY KEY (`id`);
    
ALTER TABLE `migrations`
    MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

COMMIT;
"""

}
