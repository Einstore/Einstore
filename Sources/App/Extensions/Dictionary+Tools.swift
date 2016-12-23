//
//  Dictionary+Tools.swift
//  Boost
//
//  Created by Ondrej Rafaj on 18/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor


extension Dictionary {
    
    static func get(fromPlistAtUrl url: URL) throws -> [String: AnyObject]? {
        var format = PropertyListSerialization.PropertyListFormat.xml
        let plistData: Data = try Data.init(contentsOf: url)
        let plist: [String: AnyObject]? = try PropertyListSerialization.propertyList(from: plistData, options: [], format: &format) as? [String:AnyObject]
        return plist
    }

}
