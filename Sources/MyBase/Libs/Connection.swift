//
//  Connection.swift
//  Queries
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import MySQL


public func sanitize(_ string: String) -> String {
    return string
}

public struct Connection {
    
    static var host: String = "localhost"
    static var user: String = "root"
    static var pass: String? = nil
    static var port: UInt16 = 3306
    static var db: String = "boost"
    
    static let poolQueue: DispatchQueue = DispatchQueue(label: "multi")
    
//    public static let administrativeConnection = try! MySQLConnection.makeConnection(
//        hostname: host,
//        port: port,
//        user: user,
//        password: pass,
//        database: db,
//        on: Connection.poolQueue
//    ).blockingAwait(timeout: .seconds(10))
    
    public static func pool(for worker: EventLoop) -> MySQLConnectionPool {
        let connectionPool = MySQLConnectionPool(hostname: host, port: port, user: user, password: pass, database: db, on: worker)
        return connectionPool
    }
    
}
