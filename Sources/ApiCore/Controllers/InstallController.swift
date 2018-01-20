//
//  InstallController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 13/01/2018.
//

import Foundation
import Vapor
import ApiErrors
import DbCore


public class InstallController: Controller {
    
    public static func boot(router: Router) throws {
        router.get("install") { (req)->Future<Response> in
            return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                return install(connection: db, request: req)
            }
        }
        
        router.get("demo") { req in
            return try req.response.maintenanceFinished(message: "Demo install finished")
        }
        
        router.get("uninstall") { req in
            return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                return req.dbHelpers.showTables().flatMap(to: Response.self, { (tables) -> Future<Response> in
                    var arr: [Future<Void>] = []
                    for table in tables {
                        arr.append(db.administrativeQuery("DROP TABLE `\(table)`;"))
                    }
                    return arr.map(to: Response.self, { () -> Response in
                        return try req.response.maintenanceFinished(message: "Un-install finished")
                    })
                })
            }
        }
        
        router.get("reinstall") { (req)->Future<Response> in
            return req.withPooledConnection(to: .db) { (db) -> Future<Response> in
                let objects = [
                    install(connection: db, request: req)
                ]
                return objects.map(to: Response.self, { (_)  -> Response in
                    return try req.response.maintenanceFinished(message: "Re-install finished")
                })
            }
        }
        
        router.get("tables") { req in
            return req.dbHelpers.showTables()
        }
    }
    
}


extension InstallController {
    
    static func install(connection db: DbCoreDatabase.Connection, request req: Request) -> Future<Response> {
        let user = User(firstname: "Super", lastname: "Admin", email: "admin@liveui.io", password: "admin", disabled: false, su: true)
        let objects = [
            user.save(on: db)
        ]
        return objects.map(to: Response.self, { (Void) -> Response in
            return try req.response.maintenanceFinished(message: "Install finished")
        })
    }
    
}
