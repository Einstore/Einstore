//
//  InstallController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 13/01/2018.
//

import Foundation
import Vapor
import ErrorsCore
import DbCore


public class InstallController: Controller {
    
    public enum InstallError: FrontendError {
        case dataExists
        
        public var code: String {
            return "install_failed"
        }
        
        public var description: String {
            return "Data already exists"
        }
        
        public var status: HTTPStatus {
            return .preconditionFailed
        }
    }
    
    public static func boot(router: Router) throws {
        router.get("install") { (req)->Future<Response> in
            return install(on: req)
        }
        
//        router.get("demo") { req in
//            return uninstall(on: req).flatMap(to: Response.self) { (_) -> Future<Response> in
//                let objects = [
//                    su.save(on: req)
//                ]
//                return objects.map(to: Response.self, on: req) { (Void) -> Response in
//                    return try req.response.maintenanceFinished(message: "Demo install finished")
//                }
//            }
//        }
        
//        router.get("uninstall") { (req)->Future<Response> in
//            return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
//                return req.dbHelpers.showTables().flatMap(to: Response.self, { (tables) -> Future<Response> in
//                    var arr: [Future<Void>] = []
//                    for table in tables {
//                        arr.append(db.simpleQuery("DROP TABLE `\(table)`;").flatten())
//                    }
//                    return arr.map(to: Response.self, { () -> Response in
//                        return try req.response.maintenanceFinished(message: "Un-install finished")
//                    })
//                })
//            }
//        }
        
//        router.get("reinstall") { (req)->Future<Response> in
//            return uninstall(on: req).flatMap(to: Response.self) { (_) -> Future<Response> in
//                let objects = [
//                    install(on: req)
//                ]
//                return objects.map(to: Response.self, on: req) { (_)  -> Response in
//                    return try req.response.maintenanceFinished(message: "Re-install finished")
//                }
//            }
//        }
        
        router.get("tables") { req in
            // TODO: Show table names and other info
            return FluentDesign.query(on: req).all()
        }
    }
    
}


extension InstallController {
    
    private static var su: User {
        return User(firstname: "Super", lastname: "Admin", email: "admin@liveui.io", password: "admin", disabled: false, su: true)
    }
    
    private static var adminTeam: Team {
        return Team(name: "Admin team", identifier: "admin-team")
    }
    
//    private static func uninstall(on req: Request) -> Future<Void> {
//        return Future(Void())
//    }
    
    private static func install(on req: Request) -> Future<Response> {
        return User.query(on: req).count().flatMap(to: Response.self) { count in
            if count > 0 {
                throw InstallError.dataExists
            }
            return su.save(on: req).flatMap(to: Response.self) { user in
                return adminTeam.save(on: req).flatMap(to: Response.self) { team in
                    var futures = [
                        team.users.attach(user, on: req).flatten()
                    ]
                    try ApiCore.installFutures.forEach({ closure in
                        futures.append(try closure(req))
                    })
                    return futures.map(to: Response.self) { join in
                        return try req.response.maintenanceFinished(message: "Installation finished, login as admin@liveui.io/admin")
                    }
                }
            }
        }
    }
    
}
