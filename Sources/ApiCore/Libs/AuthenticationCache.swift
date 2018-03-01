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
    
    init(userId: DbCoreIdentifier) {
        self.userId = userId
    }
    
}
