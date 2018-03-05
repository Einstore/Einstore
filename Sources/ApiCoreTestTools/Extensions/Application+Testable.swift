//
//  Application+Testable.swift
//  ApiCoreTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import DbCore
@testable import ApiCore
import Vapor
import Fluent
import VaporTestTools


extension TestableProperty where TestableType: Application {
    
    public static func newApiCoreTestApp(databaseConfig: DatabaseConfig? = nil, _ configClosure: AppConfigClosure? = nil, _ routerClosure: AppRouterClosure? = nil) -> Application {
        let db = databaseConfig ?? DbCore.config(hostname: "localhost", user: "test", password: "aaaaaa", database: "boost-test")
        let app = new({ (config, env, services) in
            // Reset static configs
            DbCore.migrationConfig = MigrationConfig()
            ApiCore.middlewareConfig = MiddlewareConfig()
            
            try! ApiCore.configure(databaseConfig: db, &config, &env, &services)
            configClosure?(&config, &env, &services)
        }) { (router) in
            routerClosure?(router)
            try! ApiCore.boot(router: router)
        }
        
        return app
    }
    
}
