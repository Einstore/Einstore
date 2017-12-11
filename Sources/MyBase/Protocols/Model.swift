//
//  Table.swift
//  Queries
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation


public protocol Model {
    static var tableName: String { get }
    static var create: String { get }
}

public protocol HasForeignId {
    static var foreignIdName: String { get }
}
