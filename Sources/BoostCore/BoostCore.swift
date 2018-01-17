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
        DbCore.migrationConfig.add(model: Tag.self, database: .db)
        
        try ApiCore.configure(&config, &env, &services)
        try DbCore.configure(&config, &env, &services)
    }
    
}
