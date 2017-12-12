//
//  Migrations+Boost.swift
//  App
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import MyBase


extension Migrations {
    
    var boost: [String] {
        return [
//            """
//ALTER TABLE `apps`
//    ADD CONSTRAINT `fk_app_id`
//    FOREIGN KEY (`id`)
//    REFERENCES `apps_tags` (`app_id`)
//    ON DELETE CASCADE
//    ON UPDATE NO ACTION;
//""",
//            """
//ALTER TABLE `tags`
//    ADD CONSTRAINT `fk_tag_id`
//    FOREIGN KEY (`id`)
//    REFERENCES `apps_tags` (`tag_id`)
//    ON DELETE CASCADE
//    ON UPDATE NO ACTION;
//""",
            
            ]
    }
    
}
