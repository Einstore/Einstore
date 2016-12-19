//
//  ExpirationMemoryCache.swift
//  Boost
//
//  Created by Ondrej Rafaj on 18/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Cache
import Node


public final class ExpirationMemoryCache: CacheProtocol {
    
    private var storage: [String: Node]
    private var expiration: [String: Date]
    
    
    public init() {
        self.storage = [:]
        self.expiration = [:]
    }
    
    public func get(_ key: String) throws -> Node? {
        if let exp = self.expiration[key], Date().compare(exp) == .orderedDescending {
            return nil
        }
        
        return self.storage[key]
    }
    
    public func set(_ key: String, _ value: Node) throws {
        self.storage[key] = value
        self.expiration.removeValue(forKey: key)
    }
    
    public func set(_ key: String, _ value: Node, expiringAt date: Date) throws {
        self.storage[key] = value
        self.expiration[key] = date
    }
    
    public func set(_ key: String, _ value: Node, withTTL ttl: TimeInterval) throws {
        try set(key, value, expiringAt: Date(timeIntervalSinceNow: ttl))
    }
    
    public func delete(_ key: String) throws {
        self.storage.removeValue(forKey: key)
        self.expiration.removeValue(forKey: key)
    }
}
