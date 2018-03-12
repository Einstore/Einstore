//
//  LogsController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 11/03/2018.
//

import Foundation
import Vapor
import FluentPostgreSQL


public class LogsController: Controller {
    
    public static func boot(router: Router) throws {
        router.get("errors") { (req) -> Future<[ErrorLog]> in
            return ErrorLog.query(on: req).sort(\ErrorLog.added, .descending).all()
        }
    }
}
