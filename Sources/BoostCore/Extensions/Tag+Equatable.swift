//
//  Tag+Equatable.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 06/03/2018.
//

import Foundation
import DbCore


extension Tag: Equatable {
    
    public static func ==(lhs: Tag, rhs: Tag) -> Bool {
        return lhs.id == rhs.id && lhs.identifier == rhs.identifier && lhs.name == rhs.name
    }
    
}


extension Array where Element == Tag {
    
    public var ids: [DbCoreIdentifier] {
        let all: [Tag] = filter { $0.id != nil }
        return all.compactMap { $0.id }
    }
    
    public var names: [String] {
        return compactMap { $0.name }
    }
    
    public var identifiers: [String] {
        return compactMap { $0.identifier }
    }
    
    public func contains(id: DbCoreIdentifier) -> Bool {
        return ids.contains(id)
    }
    
    public func contains(identifier: String) -> Bool {
        return identifiers.contains(identifier)
    }
    
    public func contains(name: String) -> Bool {
        return names.contains(name)
    }
    
}
