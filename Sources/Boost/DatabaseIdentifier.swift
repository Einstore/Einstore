//
//  DatabaseIdentifier.swift
//  Boost
//
//  Created by Ondrej Rafaj on 28/12/2017.
//

import Foundation
import Fluent
import FluentMySQL


extension DatabaseIdentifier {
    
    public static var boost: DatabaseIdentifier<MySQLDatabase> {
        return .init("boost")
    }
    
}
