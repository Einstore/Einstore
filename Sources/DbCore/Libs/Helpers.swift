//
//  Helpers.swift
//  DbCore
//
//  Created by Ondrej Rafaj on 14/01/2018.
//

import Foundation
import Vapor
import PostgreSQL
import FluentPostgreSQL
import Fluent

public struct Helpers {
    
    let request: Request
    
    init(_ request: Request) {
        self.request = request
    }
    
}


extension Helpers {
    
    public func showTables() -> Future<[String]> {
        return request.withPooledConnection(to: .db) { (db: PostgreSQLDatabase.Connection) -> Future<[String]> in
//            return db.all(String.self, in: "SHOW TABLES")
            
            let promise = Promise<[String]>()
            promise.complete(["n/a"])
            return promise.future
        }
    }
    
}
