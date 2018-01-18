//
//  TeamsController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 17/01/2018.
//

import Foundation
import Vapor
import FluentMySQL
import DbCore


class TeamsController: Controller {
    
    static func boot(router: Router) throws {
        
        router.get("teams") { (req) -> Future<[Team]> in
            return Team.query(on: req).all()
//            let teams: [Int] = try req.authInfo.teamIds()
//            return Team.query(on: req).filter(\Team.id, in: teams).all()
        }
        
        router.get("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            let id = try req.parameter(Int.self)
            return try Team.verifiedTeam(request: req, id: id)
        }
        
        router.post("teams") { (req) -> Future<Team> in
            return try req.content.decode(Team.New.self).flatMap(to: Team.self, { (newTeam) -> Future<Team> in
                return req.withPooledConnection(to: .db) { (db) -> Future<Team> in
                    return Team.exists(identifier: newTeam.identifier, on: db).flatMap(to: Team.self, { (identifierExists) -> Future<Team> in
                        if identifierExists {
                            throw Team.TeamError.identifierAlreadyExists
                        }
                        return newTeam.insertable.save(on: db).map(to: Team.self, { (team) -> Team in
                            guard team.id != nil else {
                                throw DbError.insertFailed
                            }
                            return team
                        })
                    })
                    
                }
            })
        }
        
        router.post("teams", "check") { (req) -> Future<Response> in
            return try req.content.decode(Team.Identifier.self).flatMap(to: Response.self, { (identifierObject) -> Future<Response> in
                return req.withPooledConnection(to: DatabaseIdentifier.db) { (db) -> Future<Response> in
                    return Team.exists(identifier: identifierObject.identifier, on: db).map(to: Response.self, { (identifierExists) -> Response in
                        if identifierExists {
                            throw Team.TeamError.identifierAlreadyExists
                        }
                        return req.response.successRequest(status: .noContent, code: "a", description: "a")
                    })
                    
                }
            })
        }
        
        router.put("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            let id = try req.parameter(Int.self)
            return try Team.verifiedTeamQuery(request: req, id: id).first().map(to: Team.self, { (team) -> Team in
                return team!
            })
        }
        
        router.put("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            let id = try req.parameter(Int.self)
            return try Team.verifiedTeamQuery(request: req, id: id).first().map(to: Team.self, { (team) -> Team in
                return team!
            })
        }
        
        router.patch("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            // TODO: Make a partial update when it becomes available
            let id = try req.parameter(Int.self)
            return try Team.verifiedTeam(request: req, id: id)
        }
        
        router.delete("teams", DbCoreIdentifier.parameter) { (req) -> Future<Response> in
            // TODO: Reload JWT token if successful with new info
            // QUESTION: Should we make sure user has at least one team?
            let id = try req.parameter(Int.self)
            return try Team.verifiedTeamQuery(request: req, id: id).delete().map(to: Response.self, { () -> Response in
                return try req.response.successRequest(code: "deleted", description: "Team has been deleted")
            })
        }
        
    }
    
}


extension TeamsController {
    

    
}
