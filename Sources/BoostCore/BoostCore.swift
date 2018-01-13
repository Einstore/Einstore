//
//  Boost.swift
//  Boost
//
//  Created by Ondrej Rafaj on 12/12/2017.
//

import Foundation
import Vapor
import ApiCore
import ApiErrors
import SQLEncoder
import Fluent
import FluentMySQL
import DbCore


public class Boost {
    
    public static func boot(_ app: Application) throws {
        
    }
    
    static var controllers: [Controller.Type] = [
        TagsController.self,
        AppsController.self
    ]
    
    public static func boot(router: Router) throws {
        try ApiCore.boot(router: router)
        
        for c in controllers {
            try c.boot(router: router)
        }
    }
    
    public static func configure(_ config: inout Config, _ env: inout Environment, _ services: inout Services) throws {
        DbCore.migrationConfig.add(model: App.self, database: .db)
        
        try ApiCore.configure(&config, &env, &services)
        try DbCore.configure(&config, &env, &services)
        
        var middlewareConfig = MiddlewareConfig()
//        middlewareConfig.use(FileMiddleware.self)
        middlewareConfig.use(DateMiddleware.self)
//        middlewareConfig.use(JWTTokenMiddleware.self)
        middlewareConfig.use(ApiErrorsMiddleware.self)
        middlewareConfig.use(UrlDebugMiddleware.self)

        services.register { container -> MiddlewareConfig in
            middlewareConfig
        }
        
//        services.register(JWTTokenMiddleware())
        
        let logger = PrintLogger()
        services.register(ApiErrorsMiddleware(environment: env, log: logger))
        services.register(UrlDebugMiddleware())
    }
    
}
