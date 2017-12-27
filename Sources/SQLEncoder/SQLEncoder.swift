//
//  SQLEncoder.swift
//  SQLSerialization
//
//  Created by Ondrej Rafaj on 20/12/2017.
//

import Foundation


public protocol SQLEncodable: Encodable, Decodable {
    static var tableName: String { get }
}


open class SQLEncoder {
    
    internal typealias KeyValuePair = (key: String, value: Any)
    internal typealias KeyValuePairs = [KeyValuePair]
    
    open var userInfo: [CodingUserInfoKey: Any] = [:]
    
    public init() { }
    
    open func insert<T: SQLEncodable>(_ value: T) throws -> String {
        let encoder = _SQLEncoder(userInfo: userInfo)
        try value.encode(to: encoder)
        
        let columns = self.columns(encoder.result.data).joined(separator: ", ")
        let values = try self.values(encoder.result.data).joined(separator: ", ")
        let query: String = "INSERT INTO `\(T.tableName)` (\(columns)) VALUES (\(values));"
        return query
    }
    
    open func update<T: SQLEncodable>(_ value: T, where whereQuery: String? = nil) throws -> String {
        let encoder = _SQLEncoder(userInfo: userInfo)
        try value.encode(to: encoder)
        
        var query: String = "UPDATE `\(T.tableName)` SET "
        
        var sets: [String] = []
        for pair in encoder.result.data {
            try sets.append("`\(pair.key)` = \(SQLSerialization.serializeValue(pair.value))")
        }
        query.append(sets.joined(separator: ", "))
        
        if whereQuery != nil {
            query.append(" WHERE \(whereQuery!)")
        }
        return query.appending(";")
    }

}

extension SQLEncoder {
    
    func columns(_ obj: KeyValuePairs) -> [String] {
        var items: [String] = []
        for pair in obj {
            items.append("`\(pair.key)`")
        }
        return items
    }
    
    func values(_ obj: KeyValuePairs) throws -> [String] {
        var items: [String] = []
        for pair in obj {
            try items.append(SQLSerialization.serializeValue(pair.value))
        }
        return items
    }
    
}

fileprivate class _SQLEncoder : Encoder {
    
    var result: _SQLPartiallyEncodedData
    
//    var dateEncodingStrategy: SQLEncoder.DateEncodingStrategy = .mySQLDate
    
    init(userInfo: [CodingUserInfoKey: Any], codingPath: [CodingKey] = [], referencing: _SQLPartiallyEncodedData = .init(data: SQLEncoder.KeyValuePairs())) {
        self.userInfo = userInfo
        self.codingPath = codingPath
        self.result = referencing
    }
    
    fileprivate func with<T>(pushedKey key: CodingKey, _ work: () throws -> T) rethrows -> T {
        self.codingPath.append(key)
        let ret = try work()
        self.codingPath.removeLast()
        return ret
    }
    
    // MARK: Encoder protocol
    
    public var codingPath: [CodingKey]
    public var userInfo: [CodingUserInfoKey : Any]
    
    public func container<Key: CodingKey>(keyedBy type: Key.Type) -> KeyedEncodingContainer<Key> {
        return .init(_SQLKeyedEncodingContainer<Key>(referencing: self, codingPath: self.codingPath, wrapping: result))
    }
    
    public func unkeyedContainer() -> UnkeyedEncodingContainer {
        fatalError("SQL encoder doesn't support arrays")
    }
    
    public func singleValueContainer() -> SingleValueEncodingContainer {
        return _SQLSingleValueEncodingContainer(referencing: self, codingPath: self.codingPath, wrapping: result)
    }
}


fileprivate final class _SQLPartiallyEncodedData {
    
    fileprivate var data: SQLEncoder.KeyValuePairs
    
    fileprivate init(data: SQLEncoder.KeyValuePairs) {
        self.data = data
    }
    
    fileprivate func set(_ value: Any, atPath path: [CodingKey]) throws {
        switch path.count {
            case 1:
                self.data.append((key: path[0].stringValue, value))
            default:
                throw EncodingError.invalidValue(value, EncodingError.Context(codingPath: path, debugDescription: "Can't nest \(path.count) levels deep in SQL encoder"))
        }
    }
}

fileprivate class _SQLKeyedEncodingContainer<K: CodingKey>: KeyedEncodingContainerProtocol {
    
    private let encoder: _SQLEncoder
    private let container: _SQLPartiallyEncodedData
    
    init(referencing: _SQLEncoder, codingPath: [CodingKey], wrapping: _SQLPartiallyEncodedData) {
        self.encoder = referencing
        self.codingPath = codingPath
        self.container = wrapping
    }
    
    // MARK: KeyedEncodingContainerProtocol protocol
    
    public var codingPath: [CodingKey]
    
    public func encodeNil(forKey key: K) throws {
    	try self.encoder.with(pushedKey: key) {
            try container.set("", atPath: self.encoder.codingPath)
        }
    }
    
    public func encode(_ value: Bool, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: Int, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: Int8, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: Int16, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: Int32, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: Int64, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: UInt, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: UInt8, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: UInt16, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: UInt32, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: UInt64, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: Float, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: Double, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(date value: Date, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode(_ value: String, forKey key: K) throws {
        try encoder.with(pushedKey: key) {
            try container.set(value, atPath: encoder.codingPath)
        }
    }
    
    public func encode<T>(_ value: T, forKey key: K) throws where T : Encodable {
        if T.self == Date.self || T.self == NSDate.self {
            try encode(date: value as! Date, forKey: key)
        }
        else {
            try encoder.with(pushedKey: key) {
                let innerEncoder = _SQLEncoder(userInfo: encoder.userInfo, codingPath: encoder.codingPath, referencing: encoder.result)
                try value.encode(to: innerEncoder)
            }
        }
    }
    
    public func nestedContainer<NestedKey: CodingKey>(keyedBy keyType: NestedKey.Type, forKey key: K) -> KeyedEncodingContainer<NestedKey> {
        fatalError("SQL encoder doesn't support nested containers")
    }
    
    public func nestedUnkeyedContainer(forKey key: K) -> UnkeyedEncodingContainer {
        fatalError("SQL encoder doesn't support arrays")
    }
    
    public func superEncoder() -> Encoder {
        return _SQLEncoder(userInfo: encoder.userInfo, codingPath: encoder.codingPath, referencing: encoder.result)
    }
    
    public func superEncoder(forKey key: K) -> Encoder {
        return encoder.with(pushedKey: key) { superEncoder() }
    }
}

fileprivate class _SQLSingleValueEncodingContainer: SingleValueEncodingContainer {
    
    private let encoder: _SQLEncoder
    private let container: _SQLPartiallyEncodedData
    
    fileprivate init(referencing: _SQLEncoder, codingPath: [CodingKey], wrapping: _SQLPartiallyEncodedData) {
        self.encoder = referencing
        self.codingPath = codingPath
        self.container = wrapping
    }
    
    // MARK: SingleValueEncodingContainer protocol
    
    public var codingPath: [CodingKey]
    
    public func encodeNil() throws { try container.set("", atPath: self.codingPath) }
    public func encode(_ value: Bool) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: Int) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: Int8) throws { try container.set(value, atPath: self.codingPath)}
    public func encode(_ value: Int16) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: Int32) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: Int64) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: UInt) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: UInt8) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: UInt16) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: UInt32) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: UInt64) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: Float) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: Double) throws { try container.set(value, atPath: self.codingPath) }
    public func encode(_ value: String) throws { try container.set(value, atPath: self.codingPath) }
    public func encode<T>(_ value: T) throws where T : Encodable {
        let innerEncoder = _SQLEncoder(userInfo: encoder.userInfo, codingPath: self.codingPath, referencing: self.container)
        try value.encode(to: innerEncoder)
    }
}
