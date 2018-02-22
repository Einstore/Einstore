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
            // TODO: Get only databases that belong to this schema!!!!
            return try db.query("SELECT * FROM `pg_catalog.pg_tables`;").map(to: [String].self, { (data) -> [String] in
                var new: [String] = []
                for row in data {
                    guard let nameData = row["tablename"]?.data, let name = String(data: nameData, encoding: .utf8) else {
                        continue
                    }
                    new.append(name)
                }
                return new
            })
        }
    }
    
}
