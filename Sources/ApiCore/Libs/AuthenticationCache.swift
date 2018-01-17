//
//  AuthenticationCache.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 18/01/2018.
//

import Foundation
import Vapor
import DbCore


final class AuthenticationCache: Service {
    
    var userId: DbCoreIdentifier
    var teamIds: [DbCoreIdentifier]
    
    init(userId: DbCoreIdentifier, teamIds: [DbCoreIdentifier]) {
        self.userId = userId
        self.teamIds = teamIds
    }
    
}
