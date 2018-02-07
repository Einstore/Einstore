//
//  ApkStrings.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 07/02/2018.
//

import Foundation
import ApiCore


struct ApkStrings: Codable {
    
    struct Resources: Codable {
        
        struct Item: Codable {
            let tail: String?
            let text: String
            let name: String
            
            enum CodingKeys: String, CodingKey {
                case tail = "#tail"
                case text = "#text"
                case name = "@name"
            }
        }
        
        let items: [Item]
        
        enum CodingKeys: String, CodingKey {
            case items = "string"
        }
        
    }
    
    let text: String?
    let resources: Resources
    
    enum CodingKeys: String, CodingKey {
        case text = "#text"
        case resources
    }
    
}


extension ApkStrings {
    
    subscript(key: Dictionary<String, Resources.Item>.Key) -> Resources.Item? {
        for item in resources.items {
            if item.name == key {
                return item
            }
        }
        return nil
    }
    
}


extension ApkStrings: JSONDecodable {
    public typealias ModelType = ApkStrings
}
