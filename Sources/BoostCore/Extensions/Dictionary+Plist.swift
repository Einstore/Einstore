//
//  Dictionary+Plist.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 15/01/2018.
//

import Foundation


extension Dictionary where Key == String {
    
    static func fill(fromPlist url: URL, format: PropertyListSerialization.PropertyListFormat = .binary) throws -> [String: AnyObject]? {
        let plistData: Data = try Data(contentsOf: url)
        var varFormat: PropertyListSerialization.PropertyListFormat = format
        let plist: [String: AnyObject]? = try PropertyListSerialization.propertyList(from: plistData, options: [], format: &varFormat) as? [String:AnyObject]
        return plist
    }
    
}
