//
//  EventLoop+DB.swift
//  Queries
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import MySQL


extension EventLoop {
    
    public var pool: MySQLConnectionPool {
        return Connection.pool(for: self)
    }
    
}
