//
//  MyBase.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import FluentMySQL


public class MyBase {
    
    public static var databaseIdentifier: DatabaseIdentifier<MySQLDatabase>!
    
    static var controllers: [Controller.Type] = [
//        InstallController.self,
        UsersController.self,
//        TeamsController.self
    ]
    
    public static func boot(router: Router) throws {
        for c in controllers {
            try c.boot(router: router)
        }
    }
    
}
