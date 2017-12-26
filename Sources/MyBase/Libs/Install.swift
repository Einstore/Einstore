//
//  Install.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import MySQL


public class Install {
    
    var worker: Worker
    
    public var models: [Model.Type] = [
        Migration.self,
        User.self,
        Team.self
    ]
    
    // TODO: Make return strings when available
    public var tables: [Table] {
        let tables = try! worker.pool.retain({ (connection) -> Future<[Table]> in
            let objectsFuture = connection.all(Table.self, in: "SHOW TABLES")
            return objectsFuture
        }).systemBlockingAwait()
        return tables
    }
    
    func installModels(_ worker: Worker) {
        let tables = self.tables
        for model in self.models {
            if !tables.contains(table: model.tableName) {
                try! worker.pool.retain({ (connection) -> Future<Void> in
                    connection.administrativeQuery(model.create)
                }).systemBlockingAwait()
            }
        }
//        _ = try! worker.pool.retain({ (connection) -> Future<Void> in
//            var results = [Future<Void>]()
//
//            for model in self.models {
//                if !tables.contains(table: model.tableName) {
//                    results.append(connection.administrativeQuery(model.create))
//                }
//            }
//
//            let allDone: Future<Void> = results.flatten()
//            return allDone
//        }).systemBlockingAwait()
    }
    
    public func proceed(_ worker: Worker) {
        installModels(worker)
    }
    
    // MARK: Initialization
    
    public init(_ worker: Worker) {
        self.worker = worker
    }
    
}
