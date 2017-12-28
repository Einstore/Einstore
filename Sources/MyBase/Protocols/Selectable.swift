//
//  Selectable.swift
//  Queries
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import SQLEncoder

/**
 Protocol allowing access to queries on models
 */
public protocol Selectable: Model, SQLEncodable {
    
//    associatedtype PropertyParentType
//    var query: Manipulation<PropertyParentType> { get }
    
}

extension Selectable {
    
    // MARK: Queries
    
    /// Queries for model
//    public var query: Manipulation<Self> {
//        get {
//            return Manipulation(self)
//        }
//    }
    
    public static var select: String {
        return "SELECT * FROM `\(self.tableName)`"
    }
    
    public static var count: String {
        return "SELECT COUNT(*) FROM `\(self.tableName)`"
    }
    
    public static func all<T>(_ req: Request) -> Future<[T]> where T: Decodable {
        let data = req.pool.retain({ (connection) -> Future<[T]> in
            let objectsFuture = connection.all(T.self, in: self.select)
            return objectsFuture
        })
        return data
    }
    
}
