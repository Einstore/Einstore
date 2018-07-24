//
//  SettingsCore.swift
//  SettingsCore
//
//  Created by Ondrej Rafaj on 20/2/2018.
//

import Foundation
import ApiCore
import DbCore
import Vapor


public class BumpUpCore {
    
    static var controllers: [Controller.Type] = [
        SettingsController.self
    ]
    
    public static func boot(router: Router) throws {
        for c in controllers {
            try c.boot(router: router)
        }
    }
    
    public static func configure(_ config: inout Config, _ env: inout Vapor.Environment, _ services: inout Services) throws {
        ApiAuthMiddleware.allowedGetUri.append("/settings")
        
        DbCore.add(model: Setting.self, database: .db)
    }
    
}
