//
//  Encodable+Tools.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 22/02/2018.
//

import Foundation


extension Encodable {
    
    public func asPropertyList() throws -> Data {
        let jsonData = try JSONEncoder().encode(self)
        let data = try JSONSerialization.jsonObject(with: jsonData, options: [])
        let plistData = try PropertyListSerialization.data(fromPropertyList: data, format: .xml, options: 0)
        return plistData
    }
    
    public func asJson() throws -> Data {
        let jsonData = try JSONEncoder().encode(self)
        return jsonData
    }
    
}
