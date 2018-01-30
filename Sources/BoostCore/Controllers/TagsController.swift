//
//  TagsController.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import ApiCore
import DbCore
import Fluent
import FluentMySQL


class TagsController: Controller {
    
    static func boot(router: Router) throws {
        router.get("tags") { (req) -> Future<Tags> in
            return req.withPooledConnection(to: .db) { (db) -> Future<Tags> in
                return tagsQuery(on: db).all()
            }
        }
    }
    
}


extension TagsController {
    
    static func tagsQuery(on db: DbCoreDatabase.Connection, apps: Apps? = nil) -> QueryBuilder<Tag> {
        return Tag.query(on: db)
    }
    
}
