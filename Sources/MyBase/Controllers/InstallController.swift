//
//  InstallController.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor


public class InstallController: Controller {
    
    public static func boot(router: Router) throws {
        router.get("migrations") { req -> Future<[Migration]> in
            return Migration.all(req)
        }   
    }
    
}
