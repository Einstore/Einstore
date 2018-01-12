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


public class ApiCore {
    
    public static var databaseIdentifier: DatabaseIdentifier<DbCoreDatabase>!
    
    static var controllers: [Controller.Type] = [
//        InstallController.self,
        UsersController.self,
//        TeamsController.self
    ]
    
    public static func configure(_ config: inout Config, _ env: inout Environment, _ services: inout Services) throws {
        
    }
    
    public static func boot(router: Router) throws {
        for c in controllers {
            try c.boot(router: router)
        }
    }
    
}
