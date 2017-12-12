//
//  TagsController.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import MyBase


class TagsController: Controller {
    
    static func boot(router: Router) throws {
        router.get("tags") { req -> Future<[Tag]> in
            return Tag.all(req)
        }
        
    }
    
}
