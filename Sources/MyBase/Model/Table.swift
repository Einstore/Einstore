//
//  Table.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation


protocol TableProtocol {
    var name: String { get }
}


public struct Table: TableProtocol, Codable {
    
    let name: String
    
    enum CodingKeys: String, CodingKey {
        case name = "Tables_in_boost"
    }
    
}


extension Array where Element: TableProtocol {
    
    func contains(table name: String) -> Bool {
        for t in self {
            if t.name == name {
                return true
            }
        }
        return false
    }
    
}
