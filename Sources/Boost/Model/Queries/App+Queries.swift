//
//  App+Queries.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import MyBase
import Vapor


extension App: Selectable, HasForeignId {
    
    static var tableName: String = "apps"
    static var foreignIdName: String = "app_id"
    
    static var create: String = """
CREATE TABLE `\(App.tableName)` (
    `id` int(11) UNSIGNED NOT NULL,
    `\(Team.foreignIdName)` int(11) UNSIGNED NOT NULL,
    `name` varchar(140) NOT NULL,
    `identifier` varchar(140) NOT NULL,
    `version` varchar(50) NOT NULL,
    `build` varchar(30) NOT NULL,
    `platform` smallint(1) UNSIGNED NOT NULL DEFAULT '0',
    `created` datetime NOT NULL,
    `modified` datetime NULL,
    `basic` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `\(App.tableName)`
    ADD PRIMARY KEY (`id`),
    ADD KEY `varchars` (`name`,`identifier`,`version`,`build`),
    ADD KEY `integers` (`platform`,`basic`),
    ADD KEY `dates` (`created`,`modified`);

ALTER TABLE `\(App.tableName)`
    MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
    
ALTER TABLE `\(App.tableName)`
    ADD CONSTRAINT `fk-\(App.tableName)-\(Team.foreignIdName)`
        FOREIGN KEY (`\(Team.foreignIdName)`)
        REFERENCES `\(Team.tableName)` (`id`)
        ON DELETE CASCADE
        ON UPDATE NO ACTION;
    
CREATE TABLE `\(App.tableName)_\(Tag.tableName)` (
    `\(App.foreignIdName)` int(11) UNSIGNED NOT NULL,
    `\(Tag.foreignIdName)` int(11) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `\(App.tableName)_\(Tag.tableName)`
    ADD KEY `indexes` (`\(App.foreignIdName)`,`\(Tag.foreignIdName)`);
    
ALTER TABLE `\(App.tableName)_\(Tag.tableName)`
    ADD CONSTRAINT `fk-\(App.tableName)_\(Tag.tableName)-\(App.foreignIdName)`
        FOREIGN KEY (`\(App.foreignIdName)`)
        REFERENCES `\(App.tableName)` (`id`)
        ON DELETE CASCADE
        ON UPDATE NO ACTION,
    ADD CONSTRAINT `fk-\(App.tableName)_\(Tag.tableName)-\(Tag.foreignIdName)`
        FOREIGN KEY (`\(Tag.foreignIdName)`)
        REFERENCES `\(Tag.tableName)` (`id`)
        ON DELETE CASCADE
        ON UPDATE NO ACTION;
    
COMMIT;
"""
    
}

