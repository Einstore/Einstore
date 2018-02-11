//
//  Model+Types.swift
//  DbCore
//
//  Created by Ondrej Rafaj on 11/02/2018.
//

import Foundation
import Fluent
import FluentPostgreSQL


public struct DbCoreColumnType {
    
    public static func id() -> PostgreSQLColumn {
        return PostgreSQLColumn(type: .int8, size: 11)
    }
    
    public static func bigInt() -> PostgreSQLColumn {
        return PostgreSQLColumn(type: .int8, size: 20)
    }
    
    public static func varChar(_ length: Int16) -> PostgreSQLColumn {
        return PostgreSQLColumn(type: .varchar, size: length)
    }
    
    public static func datetime() -> PostgreSQLColumn {
        return PostgreSQLColumn(type: .timestamp)
    }
    
    public static func bool() -> PostgreSQLColumn {
        return PostgreSQLColumn(type: .bool)
    }
    
}


extension Model {
    
    public static var columnType: DbCoreColumnType.Type {
        return DbCoreColumnType.self
    }
    
}



