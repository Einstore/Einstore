//
//  BasicQuery.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 15/03/2018.
//

import Foundation
import Vapor


public struct BasicQuery: Codable {
    
    public let plain: Bool?
    public let from: Int?
    public let limit: Int?
    
}


extension QueryContainer {
    
    public var basic: BasicQuery? {
        let decoded = try? decode(BasicQuery.self)
        return decoded
    }
    
    public var plain: Bool? {
        return basic?.plain
    }
    
    public var from: Int? {
        return basic?.from
    }
    
    public var limit: Int? {
        return basic?.limit
    }
    
    
}
