//
//  Manipulation.swift
//  Queries
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import SQLEncoder
import MySQL


public protocol Manipulation { }


extension Manipulation where Self: SQLEncodable {
    
    // TODO: Make this non-blocking (Future returning without blockingAwaits)
    public func insert(_ request: Request) throws -> Future<UInt64> {
        let encoder = SQLEncoder()
        let insert = try encoder.insert(self)

        return request.pool.retain { (connection) -> Future<UInt64> in
//            try connection.withPreparation(statement: insert.query) { statement in
//                try statement.bind { binding in
//                    try binding.bind("ExampleUser")
//                }
//            }
            return connection.administrativeQuery(insert.query).map(to: UInt64.self) { _ in
                return connection.lastInsertID ?? 0
            }
        }
    }
    
    public func update(_ request: Request) throws {
        
    }
    
}
