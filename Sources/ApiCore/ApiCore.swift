//
//  ApiCore.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import FluentPostgreSQL
import DbCore
import ErrorsCore


public class ApiCore {
    
    public static var configuration: Configuration = Configuration.basic()
    
    public typealias DeleteTeamWarning = (_ team: Team) -> Future<Error?>
    public typealias DeleteUserWarning = (_ user: User) -> Future<Error?>
    
    public static var deleteTeamWarning: DeleteTeamWarning?
    public static var deleteUserWarning: DeleteUserWarning?
    
    public static var middlewareConfig = MiddlewareConfig()
    
    static var controllers: [Controller.Type] = [
        GenericController.self,
        InstallController.self,
        AuthController.self,
        UsersController.self,
        TeamsController.self
    ]
    
    public static func configure(databaseConfig: DatabaseConfig,_ config: inout Config, _ env: inout Environment, _ services: inout Services) throws {
        DbCore.migrationConfig.add(model: Token.self, database: .db)
        DbCore.migrationConfig.add(model: Team.self, database: .db)
        DbCore.migrationConfig.add(model: User.self, database: .db)
        DbCore.migrationConfig.add(model: TeamUser.self, database: .db)
        
        User.Display.defaultDatabase = .db
        
        ApiCore.middlewareConfig.use(ApiAuthMiddleware.self)
        ApiCore.middlewareConfig.use(ErrorsCoreMiddleware.self)
        ApiCore.middlewareConfig.use(DateMiddleware.self)
        
        services.register { container -> MiddlewareConfig in
            middlewareConfig
        }
        
        let logger = PrintLogger()
        services.register(ErrorsCoreMiddleware(environment: env, log: logger))
        services.register(ApiAuthMiddleware())
        
        // Authentication
//        services.register(<#T##factory: ServiceFactory##ServiceFactory#>)
        
        try DbCore.configure(databaseConfig: databaseConfig, &config, &env, &services)
    }
    
    public static func boot(router: Router) throws {
        for c in controllers {
            try c.boot(router: router)
        }
    }
    
}
