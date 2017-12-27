//
//  Queries.swift
//  Queries
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import SQLEncoder


public struct Queries<T> {
    
    let model: T
    
    init(_ model: T) {
        self.model = model
    }
    
}


extension Queries where T: SQLEncodable {
    
    // TODO: Make this non-blocking (Future returning without blockingAwaits)
    public func insert(_ request: Request) throws -> Int {
        let encoder = SQLEncoder()
        let query = try encoder.insert(model)
        let future = request.pool.retain { (connection) -> Future<UInt64> in
            let future = connection.administrativeQuery(query)
            let id: UInt64
            do {
                try future.systemBlockingAwait()
                id = connection.lastInsertID ?? 0
            } catch {
                id = 0
            }
            return Future<UInt64>(id)
        }
        let result = try future.systemBlockingAwait()
        return Int(result)
    }
    
    public func update(_ request: Request) throws {
        
    }
    
    public func delete(_ request: Request) throws {
        
    }
    
    public func countAll(_ request: Request) throws -> Int {
        return 0
    }
    
}
