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
import MailCore
import Leaf


public class ApiCore {
    
    public static var configuration: Configuration = Configuration.basic()
    
    public static var debugRequests: Bool = false
    
    public typealias DeleteTeamWarning = (_ team: Team) -> Future<Error?>
    public typealias DeleteUserWarning = (_ user: User) -> Future<Error?>
    
    public static var deleteTeamWarning: DeleteTeamWarning?
    public static var deleteUserWarning: DeleteUserWarning?
    
    public static var middlewareConfig = MiddlewareConfig()
    
    public typealias InstallFutureClosure = (_ req: Request) throws -> Future<Void>
    public static var installFutures: [InstallFutureClosure] = []
    
    static var controllers: [Controller.Type] = [
        GenericController.self,
        InstallController.self,
        AuthController.self,
        UsersController.self,
        TeamsController.self,
        LogsController.self
    ]
    
    public static func configure(databaseConfig: DatabaseConfig,_ config: inout Config, _ env: inout Environment, _ services: inout Services) throws {
        DbCore.migrationConfig.add(model: Token.self, database: .db)
        DbCore.migrationConfig.add(model: Team.self, database: .db)
        DbCore.migrationConfig.add(model: User.self, database: .db)
        DbCore.migrationConfig.add(model: TeamUser.self, database: .db)
        
        FluentDesign.defaultDatabase = .db
        ErrorLog.defaultDatabase = .db
        
        // System
        middlewareConfig.use(DateMiddleware.self)
        services.register(DateMiddleware())
        middlewareConfig.use(FileMiddleware.self)
        services.register(FileMiddleware(publicDirectory: "/Projects/Web/Boost/Public/build/"))
        try services.register(LeafProvider())
        

        // Authentication
        let jwtSecret = ProcessInfo.processInfo.environment["JWT_SECRET"] ?? "secret"
        if env.isRelease && jwtSecret == "secret" {
            fatalError("You can't run in production mode with JWT_SECRET set to \"secret\"")
        }
        let jwtService = JWTService(secret: jwtSecret)
        services.register(jwtService)
        services.register(AuthenticationCache())
        
        // UUID service
        services.register(RequestIdService.self)
        
        try DbCore.configure(databaseConfig: databaseConfig, &config, &env, &services)
        
        // Errors
        middlewareConfig.use(ErrorLoggingMiddleware.self)
        services.register(ErrorLoggingMiddleware())
        middlewareConfig.use(ErrorsCoreMiddleware.self)
        services.register(ErrorsCoreMiddleware(environment: env, log: PrintLogger()))
        
        // Auth
        middlewareConfig.use(ApiAuthMiddleware.self)
        services.register(ApiAuthMiddleware())
        
        // CORS
        let corsConfig = CORSMiddleware.Configuration(
            allowedOrigin: .originBased,
            allowedMethods: [.GET, .POST, .PUT, .OPTIONS, .DELETE, .PATCH],
            allowedHeaders: [.accept, .authorization, .contentType, .origin, .xRequestedWith, .userAgent],
            exposedHeaders: [
                HTTPHeaderName.authorization.description,
                HTTPHeaderName.contentLength.description,
                HTTPHeaderName.contentType.description,
                HTTPHeaderName.contentDisposition.description,
                HTTPHeaderName.cacheControl.description,
                HTTPHeaderName.expires.description
            ]
        )
        middlewareConfig.use(CORSMiddleware(configuration: corsConfig))
        
        // Register middlewares
        services.register(middlewareConfig)
        
        // Install default templates
        Templates.installMissing()
    }
    
    public static func boot(router: Router) throws {
        for c in controllers {
            try c.boot(router: router)
        }
    }
    
}
