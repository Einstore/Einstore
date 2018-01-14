//
//  ApiCore.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import FluentMySQL
import DbCore
import ApiErrors


public class ApiCore {
    
    public static var middlewareConfig = MiddlewareConfig()
    
    static var controllers: [Controller.Type] = [
        GenericController.self,
        InstallController.self,
        AuthController.self,
        UsersController.self
    ]
    
    public static func configure(_ config: inout Config, _ env: inout Environment, _ services: inout Services) throws {
        DbCore.migrationConfig.add(model: Token.self, database: .db)
        DbCore.migrationConfig.add(model: User.self, database: .db)
        
        ApiCore.middlewareConfig.use(ApiAuthMiddleware.self)
        ApiCore.middlewareConfig.use(ApiErrorsMiddleware.self)
        ApiCore.middlewareConfig.use(DateMiddleware.self)
        
        services.register { container -> MiddlewareConfig in
            middlewareConfig
        }
        
        let logger = PrintLogger()
        services.register(ApiErrorsMiddleware(environment: env, log: logger))
        services.register(ApiAuthMiddleware())
    }
    
    public static func boot(router: Router) throws {
        for c in controllers {
            try c.boot(router: router)
        }
    }
    
}
