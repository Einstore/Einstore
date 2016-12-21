//
//  QueryRepresentable+Tools.swift
//  Boost
//
//  Created by Ondrej Rafaj on 19/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import HTTP
import Fluent


extension QueryRepresentable {
    
    public func requestSorted(_ request: Request, defaultLimit: Int = 20, sortBy column: String? = nil, direction: Sort.Direction = .ascending) throws -> [T] {
        var  query: Query = try makeQuery()
        
        let limit: Int = request.query?["limit"]?.int ?? defaultLimit
        let offset: Int = request.query?["offset"]?.int ?? 0
        
        query.limit = Limit(count: limit, offset: offset)
        
        if column != nil {
            query = try query.sort(column!, direction)
        }
        
        let models = try query.run()
        models.forEach { model in
            var model = model
            model.exists = true
        }
        
        return models
    }
    
    public func requestSorted(_ request: Request, sortBy column: String, direction: Sort.Direction) throws -> [T] {
        return try self.requestSorted(request, defaultLimit: 20, sortBy: column, direction: direction)
    }
    
}
