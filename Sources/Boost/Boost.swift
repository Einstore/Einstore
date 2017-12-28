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


public class Boost {
    
    public static func boot(_ app: Application) throws {
        let install = Install(app)
        install.models.append(Tag.self)
        install.models.append(App.self)
        
        install.proceed(app)
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
        middlewareConfig.use(JWTTokenMiddleware.self)
        middlewareConfig.use(MyErrorMiddleware.self)
        middlewareConfig.use(MyDebugMiddleware.self)
        
        services.register { container -> MiddlewareConfig in
            middlewareConfig
        }
        
        services.register(JWTTokenMiddleware())
        let logger = PrintLogger()
        services.register(MyErrorMiddleware(environment: env, log: logger))
        services.register(MyDebugMiddleware())
    }
    
}
