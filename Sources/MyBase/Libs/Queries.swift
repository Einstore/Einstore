//
//  Queries.swift
//  Queries
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor


public struct Queries<T> {
    
    let model: T
    
    init(_ model: T) {
        self.model = model
    }
    
}


extension Queries where T: Queryable {
    
     public func insert(_ request: Request) throws {
        
    }
    
    public func update(_ request: Request) throws {
        
    }
    
    public func delete(_ request: Request) throws {
        
    }
    
    public func countAll(_ request: Request) throws -> Int {
        return 0
    }
    
}
