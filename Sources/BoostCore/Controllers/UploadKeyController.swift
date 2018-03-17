//
//  UploadKey.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 17/01/2018.
//

import Foundation
import Vapor
import ApiCore
import Fluent
import FluentPostgreSQL
import DbCore
import ErrorsCore


class UploadKeyController: Controller {
    
    static func boot(router: Router) throws {
        router.get("keys") { (req) -> Future<[UploadKey.Display]> in
            return try req.me.teams().flatMap(to: [UploadKey.Display].self) { teams in
                return try UploadKey.Display.query(on: req).filter(\UploadKey.Display.teamId, in: teams.ids).all()
            }
        }
        
        router.get("teams", DbCoreIdentifier.parameter, "keys") { (req) -> Future<[UploadKey.Display]> in
            let teamId = try req.parameter(DbCoreIdentifier.self)
            return try req.me.verifiedTeam(id: teamId).flatMap(to: [UploadKey.Display].self) { team in
                guard let teamId = team.id else {
                    throw ErrorsCore.HTTPError.notFound
                }
                return try UploadKey.Display.query(on: req).filter(\UploadKey.Display.teamId == teamId).all()
            }
        }
        
        router.get("keys", DbCoreIdentifier.parameter) { (req) -> Future<UploadKey.Display> in
            let keyId = try req.parameter(DbCoreIdentifier.self)
            return try UploadKey.Display.find(keyId, on: req).flatMap(to: UploadKey.Display.self) { key in
                guard let key = key else {
                    throw ErrorsCore.HTTPError.notFound
                }
                return try req.me.verifiedTeam(id: key.teamId).map(to: UploadKey.Display.self) { team in
                    return key
                }
            }
        }
    
        router.post("teams", DbCoreIdentifier.parameter, "keys") { (req) -> Future<Response> in
            let teamId = try req.parameter(DbCoreIdentifier.self)
            return try req.me.verifiedTeam(id: teamId).flatMap(to: Response.self) { team in
                guard let teamId = team.id else {
                    throw ErrorsCore.HTTPError.notFound
                }
                return try req.content.decode(UploadKey.New.self).flatMap(to: Response.self) { newKey in
                    let key = UploadKey(new: newKey, teamId: teamId)
                    let tokenCache = key.token
                    key.token = try tokenCache.passwordHash(req)
                    return key.save(on: req).flatMap(to: Response.self) { key in
                        key.token = tokenCache
                        return try key.asResponse(.created, to: req)
                    }
                }
            }
        }
        
        router.put("keys", DbCoreIdentifier.parameter) { (req) -> Future<UploadKey.Display> in
            let keyId = try req.parameter(DbCoreIdentifier.self)
            return try UploadKey.find(keyId, on: req).flatMap(to: UploadKey.Display.self) { key in
                guard let key = key else {
                    throw ErrorsCore.HTTPError.notFound
                }
                return try req.me.verifiedTeam(id: key.teamId).flatMap(to: UploadKey.Display.self) { team in
                    return try req.content.decode(UploadKey.New.self).flatMap(to: UploadKey.Display.self) { newKey in
                        key.name = newKey.name
                        key.expires = newKey.expires
                        return key.save(on: req).map(to: UploadKey.Display.self) { key in
                            return key.asDisplay()
                        }
                    }
                }
            }
        }
        
        router.delete("keys", DbCoreIdentifier.parameter) { (req) -> Future<Response> in
            let keyId = try req.parameter(DbCoreIdentifier.self)
            return try UploadKey.find(keyId, on: req).flatMap(to: Response.self) { key in
                guard let key = key else {
                    throw ErrorsCore.HTTPError.notFound
                }
                return try req.me.verifiedTeam(id: key.teamId).flatMap(to: Response.self) { team in
                    return key.delete(on: req).map(to: Response.self) { _ in
                        return try req.response.deleted()
                    }
                }
            }
        }
    }
    
}
