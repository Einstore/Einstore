//
//  TeamsController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 17/01/2018.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL
import DbCore
import ErrorsCore


class TeamsController: Controller {
    
    static func boot(router: Router) throws {
        
        router.get("teams") { (req) -> Future<[Team]> in
            return req.withPooledConnection(to: .db) { (db) -> Future<[Team]> in
                return Team.query(on: db).all()
//                let teams: [Int] = try req.authInfo.teamIds()
//                return Team.query(on: req).filter(\Team.id, in: teams).all()
            }
        }
        
        router.get("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            let id = try req.parameter(DbCoreIdentifier.self)
            return req.withPooledConnection(to: .db) { (db) -> Future<Team> in
                return try Team.verifiedTeam(connection: db, id: id)
            }
        }
        
        router.post("teams") { (req) -> Future<Response> in
            return try req.content.decode(Team.New.self).flatMap(to: Response.self, { (newTeam) -> Future<Response> in
                return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                    return Team.exists(identifier: newTeam.identifier, on: db).flatMap(to: Response.self, { (identifierExists) -> Future<Response> in
                        if identifierExists {
                            throw Team.TeamError.identifierAlreadyExists
                        }
                        return newTeam.insertable.save(on: db).flatMap(to: Response.self, { (team) -> Future<Response> in
                            guard team.id != nil else {
                                throw DbError.insertFailed
                            }
                            
                            return try team.asResponse(.created, to: req)
                        })
                    })
                }
            })
        }
        
        router.post("teams", "check") { (req) -> Future<Response> in
            return try req.content.decode(Team.Identifier.self).flatMap(to: Response.self, { (identifierObject) -> Future<Response> in
                return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                    return Team.exists(identifier: identifierObject.identifier, on: db).map(to: Response.self, { (identifierExists) -> Response in
                        if identifierExists {
                            throw Team.TeamError.identifierAlreadyExists
                        }
                        return try req.response.success(status: .ok, code: "ok", description: "Identifier available")
                    })
                }
            })
        }
        
        router.put("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            let id = try req.parameter(DbCoreIdentifier.self)
            return req.withPooledConnection(to: .db) { (db) -> Future<Team> in
                return try Team.verifiedTeamQuery(connection: db, id: id).first().flatMap(to: Team.self, { (team) -> Future<Team> in
                    guard let team = team else {
                        fatalError()
                    }
                    return try req.content.decode(Team.New.self).flatMap(to: Team.self, { (newTeam) -> Future<Team> in
                        team.name = newTeam.name
                        
                        func save() -> Future<Team> {
                            return team.save(on: db).map(to: Team.self, { (team) -> Team in
                                return team
                            })
                        }
                        
                        if team.identifier == newTeam.identifier {
                            return save()
                        }
                        
                        return Team.exists(identifier: newTeam.identifier, on: db).flatMap(to: Team.self, { (identifierExists) -> Future<Team> in
                            if identifierExists {
                                throw Team.TeamError.identifierAlreadyExists
                            }
                            
                            team.identifier = newTeam.identifier
                            
                            return save()
                        })
                    })
                })
            }
        }
        
        router.patch("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            // TODO: Make a partial update when it becomes available
            let id = try req.parameter(DbCoreIdentifier.self)
            return req.withPooledConnection(to: .db) { (db) -> Future<Team> in
                return try Team.verifiedTeam(connection: db, id: id)
            }
        }
        
        router.delete("teams", DbCoreIdentifier.parameter) { (req) -> Future<Response> in
            // TODO: Reload JWT token if successful with new info
            // QUESTION: Should we make sure user has at least one team?
            let id = try req.parameter(DbCoreIdentifier.self)
            return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                return try Team.verifiedTeamQuery(connection: db, id: id).first().flatMap(to: Response.self, { (team) -> Future<Response> in
                    guard let team = team else {
                        throw Team.TeamError.teamDoesntExist
                    }
                    if let canDelete = ApiCore.deleteTeamWarning {
                        return canDelete(team).flatMap(to: Response.self, { (error) -> Future<Response> in
                            guard let error = error else {
                                return delete(team: team, request: req, on: db)
                            }
                            throw error
                        })
                    }
                    else {
                        return delete(team: team, request: req, on: db)
                    }
                })
            }
        }
        
    }
    
}


extension TeamsController {
    
    static func delete(team: Team, request req: Request, on db: DatabaseConnectable) -> Future<Response> {
        return team.delete(on: db).map(to: Response.self, { () -> Response in
            return try req.response.success(code: "deleted", description: "Team has been deleted")
        })
    }
    
}
