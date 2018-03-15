//
//  SettingsController.swift
//  SettingsCore
//
//  Created by Ondrej Rafaj on 15/03/2018.
//

import Foundation
import Vapor
import ApiCore
import DbCore
import ErrorsCore
import FluentPostgreSQL


public class SettingsController: Controller {
    
    public static func boot(router: Router) throws {
        router.get("settings") { (req) -> Future<Settings> in
            return Setting.query(on: req).all()
        }
        
        router.get("settings", DbCoreIdentifier.parameter) { (req) -> Future<Response> in
            let id = try req.parameter(DbCoreIdentifier.self)
            return Setting.query(on: req).filter(\Setting.id == id).first().flatMap(to: Response.self) { setting in
                guard let setting = setting else {
                    throw ErrorsCore.HTTPError.notFound
                }
                if req.query.plain == true  {
                    return try setting.config.asResponse(.ok, to: req)
                } else {
                    return try setting.asResponse(.ok, to: req)
                }
            }
        }
        
        router.post("settings") { (req) -> Future<Setting> in
            return try req.me.isAdmin().flatMap(to: Setting.self) { admin in
                guard admin else {
                    throw ErrorsCore.HTTPError.notAuthorizedAsAdmin
                }
                return try req.content.decode(Setting.self).flatMap(to: Setting.self) { updatedSetting in
                    return updatedSetting.save(on: req)
                }
            }
        }
        
        router.put("settings", DbCoreIdentifier.parameter) { (req) -> Future<Setting> in
            return try req.me.isAdmin().flatMap(to: Setting.self) { admin in
                guard admin else {
                    throw ErrorsCore.HTTPError.notAuthorizedAsAdmin
                }
                let id = try req.parameter(DbCoreIdentifier.self)
                return try req.content.decode(Setting.self).flatMap(to: Setting.self) { updatedSetting in
                    return Setting.query(on: req).filter(\Setting.id == id).first().flatMap(to: Setting.self) { setting in
                        guard let setting = setting else {
                            throw ErrorsCore.HTTPError.notFound
                        }
                        updatedSetting.id = setting.id
                        return updatedSetting.save(on: req)
                    }
                }
            }
        }
        
        router.delete("settings", DbCoreIdentifier.parameter) { (req) -> Future<Response> in
            return try req.me.isAdmin().flatMap(to: Response.self) { admin in
                guard admin else {
                    throw ErrorsCore.HTTPError.notAuthorizedAsAdmin
                }
                let id = try req.parameter(DbCoreIdentifier.self)
                return try Setting.query(on: req).filter(\Setting.id == id).delete().asResponse(to: req)
            }
        }
        
    }
}
