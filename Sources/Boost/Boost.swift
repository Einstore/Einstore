//
//  Boost.swift
//  Boost
//
//  Created by Ondrej Rafaj on 12/12/2017.
//

import Foundation
import Vapor
import MyBase
import MyErrors
import SQLEncoder
import Fluent
import FluentMySQL


public class Boost {
    
    public static func boot(_ app: Application) throws {
        
    }
    
    static var controllers: [Controller.Type] = [
        TagsController.self,
        AppsController.self
    ]
    
    public static func boot(router: Router) throws {
        try MyBase.boot(router: router)
        
        for c in controllers {
            try c.boot(router: router)
        }
    }
    
    public static func configure(_ config: inout Config, _ env: inout Environment, _ services: inout Services) throws {
        var middlewareConfig = MiddlewareConfig()
//        middlewareConfig.use(FileMiddleware.self)
        middlewareConfig.use(DateMiddleware.self)
//        middlewareConfig.use(JWTTokenMiddleware.self)
        middlewareConfig.use(MyErrorMiddleware.self)
        middlewareConfig.use(MyDebugMiddleware.self)
        
        services.register { container -> MiddlewareConfig in
            middlewareConfig
        }
        
//        services.register(JWTTokenMiddleware())
        let logger = PrintLogger()
        services.instance(FluentProvider())
        services.register(MyErrorMiddleware(environment: env, log: logger))
        services.register(MyDebugMiddleware())
        
        var databaseConfig = DatabaseConfig()
        let mysql = MySQLDatabase(hostname: "localhost", port: 3306, user: "root", password: nil, database: "boost")
        databaseConfig.add(database: mysql, as: .boost)
        services.instance(databaseConfig)
        
        MyBase.databaseIdentifier = .boost
    }
    
}
