//
//  AppsController.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 12/12/2017.
//

import Foundation
import Vapor
import MyBase
import FluentMySQL


class AppsController: Controller {
    
    static func boot(router: Router) throws {
        router.get("apps") { (req) -> Future<[App]> in
            return App.query(on: req).all()
        }
    }
    
}
