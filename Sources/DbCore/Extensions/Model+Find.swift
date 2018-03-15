//
//  Model+Find.swift
//  DbCore
//
//  Created by Ondrej Rafaj on 04/03/2018.
//

import Foundation
import Fluent
import Vapor


extension Model where Database: QuerySupporting {
    
    public static func find<T: Model>(_ type: T.Type = T.self, id: T.ID, on connectable: DatabaseConnectable) throws -> Future<T?> where T.Database: QuerySupporting {
        return try T.query(on: connectable).filter(\T.fluentID == id).first()
    }
    
}
