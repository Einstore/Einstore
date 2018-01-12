//
//  DbCore.swift
//  DbCore
//
//  Created by Ondrej Rafaj on 12/01/2018.
//

import Foundation
import Vapor
import FluentMySQL


public typealias DbCoreDatabase = MySQLDatabase


public class DbCore {
    
    public static var migrationConfig = MigrationConfig()
    
    public static func config(hostname: String, user: String, password: String?, database: String) -> DatabaseConfig {
        var databaseConfig = DatabaseConfig()
        let mysql = DbCoreDatabase(hostname: hostname, user: user, password: password, database: database)
        databaseConfig.add(database: mysql, as: .db)
        return databaseConfig
    }
    
    public static func configure(_ config: inout Config, _ env: inout Environment, _ services: inout Services) throws {
        try services.register(FluentMySQLProvider())
        
        let databaseConfig = self.config(hostname: "localhost", user: "root", password: nil, database: "boost")
        services.register(databaseConfig)
        
        services.register(migrationConfig)
    }
    
}
