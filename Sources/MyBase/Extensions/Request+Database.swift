//
//  Request+Database.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 28/12/2017.
//

import Foundation
import Vapor
import Fluent
import FluentMySQL


extension Request {
    
//    public var db: Database {
//        return database(.boost)
//    }
    
}


extension Request: DatabaseConnectable {}
