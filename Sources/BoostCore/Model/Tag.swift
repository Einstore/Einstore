//
//  Tag.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import DbCore


final class Tag: DbCoreModel {
    
    typealias Database = DbCoreDatabase
    typealias ID = DbCoreIdentifier
    
    static var idKey = \Tag.id
    
    var id: ID?
    var name: String
    var identifier: String
    
    init(id: ID?, name: String, identifier: String) {
        self.id = id
        self.name = name
        self.identifier = identifier
    }
    
}
