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
    
    enum TeamError: FrontendError {
        case userNotFound
        case cantAddYourself
        case userAlreadyMember
        case youAreTheLastUser
        
        var code: String {
            return "team_error"
        }
        
        var description: String {
            switch self {
            case .userNotFound:
                return "User not found"
            case .cantAddYourself:
                return "One just can not add themselves to another peoples team my friend!"
            case .userAlreadyMember:
                return "User is already a member of the team"
            case .youAreTheLastUser:
                return "You are the last user in this team; Please delete the team instead"
            }
        }
        
        var status: HTTPStatus {
            switch self {
            case .userNotFound:
                return .notFound
            case .cantAddYourself:
                return .conflict
            case .userAlreadyMember:
                return .conflict
            case .youAreTheLastUser:
                return .conflict
            }
        }
    }
    
    enum LinkAction {
        case link
        case unlink
    }
    
    static func boot(router: Router) throws {
        router.get("teams") { (req) -> Future<[Team]> in
            return try req.me().flatMap(to: [Team].self) { (user) -> Future<[Team]> in
                return try user.teams.query(on: req).all()
            }
        }
        
        router.get("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            let id = try req.parameter(DbCoreIdentifier.self)
            return try Team.verifiedTeam(connection: req, id: id).catchMap { (error) -> Team in
                throw ErrorsCore.HTTPError.notFound
            }
        }
        
        router.post("teams") { (req) -> Future<Response> in
            return try req.content.decode(Team.New.self).flatMap(to: Response.self) { (newTeam) -> Future<Response> in
                return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                    return Team.exists(identifier: newTeam.identifier, on: db).flatMap(to: Response.self) { (identifierExists) -> Future<Response> in
                        if identifierExists {
                            throw Team.TeamError.identifierAlreadyExists
                        }
                        return newTeam.insertable.save(on: db).flatMap(to: Response.self) { (team) -> Future<Response> in
                            guard team.id != nil else {
                                throw DbError.insertFailed
                            }
                            return try req.me().flatMap(to: Response.self) { (user) -> Future<Response> in
                                return team.users.attach(user, on: db).flatMap(to: Response.self) { (join) -> Future<Response> in
                                    return try team.asResponse(.created, to: req)
                                }
                            }
                        }
                    }
                }
            }
        }
        
        router.post("teams", "check") { (req) -> Future<Response> in
            return try req.content.decode(Team.Identifier.self).flatMap(to: Response.self) { (identifierObject) -> Future<Response> in
                return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                    return Team.exists(identifier: identifierObject.identifier, on: db).map(to: Response.self) { (identifierExists) -> Response in
                        if identifierExists {
                            throw Team.TeamError.identifierAlreadyExists
                        }
                        return try req.response.success(status: .ok, code: "ok", description: "Identifier available")
                    }
                }
            }
        }
        
        router.put("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            let id = try req.parameter(DbCoreIdentifier.self)
            return try Team.verifiedTeamQuery(connection: req, id: id).first().flatMap(to: Team.self, { (team) -> Future<Team> in
                guard let team = team else {
                    fatalError()
                }
                return try req.content.decode(Team.New.self).flatMap(to: Team.self) { (newTeam) -> Future<Team> in
                    team.name = newTeam.name
                    
                    func save() -> Future<Team> {
                        return team.save(on: req).map(to: Team.self) { (team) -> Team in
                            return team
                        }
                    }
                    
                    if team.identifier == newTeam.identifier {
                        return save()
                    }
                    
                    return Team.exists(identifier: newTeam.identifier, on: req).flatMap(to: Team.self) { (identifierExists) -> Future<Team> in
                        if identifierExists {
                            throw Team.TeamError.identifierAlreadyExists
                        }
                        
                        team.identifier = newTeam.identifier
                        
                        return save()
                    }
                }
            }).catchMap { (error) -> Team in
                throw ErrorsCore.HTTPError.notFound
            }
        }
        
        router.get("teams", DbCoreIdentifier.parameter, "users") { (req) -> Future<[User]> in
            let id = try req.parameter(DbCoreIdentifier.self)
            return try Team.verifiedTeam(connection: req, id: id).flatMap(to: [User].self) { (team) -> Future<[User]> in
                return try team.users.query(on: req).all()
            }
        }
        
        router.patch("teams", DbCoreIdentifier.parameter) { (req) -> Future<Team> in
            // TODO: Make a partial update when it becomes available
            let id = try req.parameter(DbCoreIdentifier.self)
            return try Team.verifiedTeam(connection: req, id: id)
        }
        
        router.patch("teams", DbCoreIdentifier.parameter, "link") { (req) -> Future<Response> in
            return try processLinking(request: req, action: .link)
        }
        
        router.patch("teams", DbCoreIdentifier.parameter, "unlink") { (req) -> Future<Response> in
            return try processLinking(request: req, action: .unlink)
        }
        
        router.delete("teams", DbCoreIdentifier.parameter) { (req) -> Future<Response> in
            // TODO: Reload JWT token if successful with new info
            // QUESTION: Should we make sure user has at least one team?
            let id = try req.parameter(DbCoreIdentifier.self)
                return try Team.verifiedTeamQuery(connection: req, id: id).first().flatMap(to: Response.self, { (team) -> Future<Response> in
                    guard let team = team else {
                        throw Team.TeamError.teamDoesntExist
                    }
                    if let canDelete = ApiCore.deleteTeamWarning {
                        return canDelete(team).flatMap(to: Response.self, { (error) -> Future<Response> in
                            guard let error = error else {
                                return delete(team: team, request: req)
                            }
                            throw error
                        })
                    }
                    else {
                        return delete(team: team, request: req)
                    }
                }).catchMap { (error) -> Response in
                    throw ErrorsCore.HTTPError.notFound
                }
        }
    }
    
}


extension TeamsController {
    
    private static func delete(team: Team, request req: Request) -> Future<Response> {
        return team.delete(on: req).map(to: Response.self, { (_) -> Response in
            return try req.response.noContent()
        })
    }
    
    private static func processLinking(request req: Request, action: TeamsController.LinkAction) throws -> Future<Response> {
        let id = try req.parameter(DbCoreIdentifier.self)
        return try Team.verifiedTeam(connection: req, id: id).flatMap(to: Response.self, { (team) -> Future<Response> in
            return try team.users.query(on: req).all().flatMap(to: Response.self) { (teamUsers) -> Future<Response> in
                return User.query(on: req).filter(\User.id == id).first().flatMap(to: Response.self) { (user) -> Future<Response> in
                    return try req.me().flatMap(to: Response.self) { (me) -> Future<Response> in
                        guard let user = user else {
                            throw TeamError.userNotFound
                        }
                        if user.id == me.id && action == .unlink && teamUsers.count <= 1 {
                            throw TeamError.youAreTheLastUser
                        }
                        if teamUsers.contains(user) {
                            if action == .link {
                                throw TeamError.userAlreadyMember
                            }
                        } else {
                            if action == .unlink {
                                throw TeamError.userNotFound
                            }
                        }
                        
                        let res = (action == .link) ? team.users.attach(user, on: req).flatten() : team.users.detach(user, on: req)
                        return res.map(to: Response.self) { (_) -> Response in
                            let message = (action == .link) ? "User has been added to the team" : "User has been removed from the team"
                            return try req.response.success(status: .ok, code: "ok", description: message)
                        }
                    }
                }
            }
        }).catchMap { (error) -> (Response) in
            throw ErrorsCore.HTTPError.notFound
        }
    }
    
}
