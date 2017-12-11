//
//  TeamsController.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor


public class TeamsController: Controller {
    
    public static func boot(router: Router) throws {
        router.get("teams") { req -> Future<[Team]> in
            return Team.all(req)
        }
    }
    
}
