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
            let teams: [Int] = try req.authInfo.teamIds()
            return Team.query(on: req).filter(\Team.id, in: teams).all()
//            return Team.query(on: req).filter(\Team.id == 1).all()
        }
        
        router.get("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            let id = try req.parameter(Int.self)
            return try verifiedTeam(request: req, id: id)
        }
        
        router.post("teams") { (req) -> Future<Team> in
            return try req.content.decode(Team.New.self).flatMap(to: Team.self, { (team) -> Future<Team> in
                return Team.query(on: req).first().map(to: Team.self, { (team) -> Team in
                    return team!
                })
            })
        }
        
        router.put("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            let id = try req.parameter(Int.self)
            return try verifiedTeamQuery(request: req, id: id).first().map(to: Team.self, { (team) -> Team in
                return team!
            })
        }
        
        router.patch("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            // TODO: Make a partial update when it becomes available
            let id = try req.parameter(Int.self)
            return try verifiedTeam(request: req, id: id)
        }
        
        router.delete("teams", DbCoreIdentifier.parameter) { (req) -> Future<Response> in
            // TODO: Reload JWT token if successful with new info
            // QUESTION: Should we make sure user has at least one team?
            let id = try req.parameter(Int.self)
            return try verifiedTeamQuery(request: req, id: id).delete().map(to: Response.self, { () -> Response in
                return try req.response.successRequest(code: "deleted", description: "Team has been deleted")
            })
        }
        
    }
    
}


extension TeamsController {
    
    static func verifiedTeamQuery(request req: Request, id: DbCoreIdentifier) throws -> QueryBuilder<Team> {
        let teams = try req.authInfo.teamIds()
        return Team.query(on: req).filter(\Team.id == id).filter(\Team.id, in: teams)
    }
    
    static func verifiedTeam(request req: Request, id: DbCoreIdentifier) throws -> Future<Team> {
        return try verifiedTeamQuery(request: req, id: id).first().map(to: Team.self, { (team) -> Team in
            guard let team = team else {
                throw ContentError.unavailable
            }
            return team
        })
    }
    
}
