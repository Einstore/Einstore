//
//  SQLSerialization.swift
//  SQLSerialization
//
//  Created by Ondrej Rafaj on 20/12/2017.
//

import Foundation

open class SQLSerialization {
    
    public enum SerializationError: Error {
        /// The data could not be interpreted according to the given encoding
        case encodingError
        /// A key or section name was not a valid identifier while serializing
        case invalidIdentifier(keyPath: String)
        /// A dictionary value was of unsupported type
        case unsupportedType(keyPath: String, type: Any.Type)
    }
    
}


extension SQLSerialization {
    
    // MARK: Serialization of types
    
    static func serializeValue(_ value: Any) throws -> String {
        let valueResult: String
        
        if let uintValue = value as? UInt { valueResult = try serializeUInt(uintValue) }
        else if let uintValue = value as? UInt8 { valueResult = try serializeUInt(uintValue) }
        else if let uintValue = value as? UInt16 { valueResult = try serializeUInt(uintValue) }
        else if let uintValue = value as? UInt32 { valueResult = try serializeUInt(uintValue) }
        else if let uintValue = value as? UInt64 { valueResult = try serializeUInt(uintValue) }
        else if let intValue = value as? Int { valueResult = try serializeInt(intValue) }
        else if let intValue = value as? Int8 { valueResult = try serializeInt(intValue) }
        else if let intValue = value as? Int16 { valueResult = try serializeInt(intValue) }
        else if let intValue = value as? Int32 { valueResult = try serializeInt(intValue) }
        else if let intValue = value as? Int64 { valueResult = try serializeInt(intValue) }
        else if let floatValue = value as? Float { valueResult = try serializeFloat(floatValue) }
        else if let floatValue = value as? Double { valueResult = try serializeFloat(floatValue) }
        else if let stringValue = value as? String { valueResult = try serializeString(stringValue) }
        else if let boolValue = value as? Bool { valueResult = try serializeBool(boolValue) }
        else {
            fatalError("Unsupported type")
        }
        
        return valueResult
    }
    
    // MARK: Private helpers
    
    internal static let identifier = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "_-")), notIdentifier = identifier.inverted
    
    private static func serializeKey(_ key: String, under topKey: String?) throws -> String {
        if let _ = key.rangeOfCharacter(from: SQLSerialization.notIdentifier) {
            throw SQLSerialization.SerializationError.invalidIdentifier(keyPath: [topKey, key].flatMap { $0 }.joined(separator: "."))
        }
        return key
    }
    
    private static func serializeUInt<T: UnsignedInteger>(_ value: T) throws -> String {
        return String(UInt(value))
    }
    
    private static func serializeInt<T: SignedInteger>(_ value: T) throws -> String {
        return String(Int(value))
    }
    
    private static func serializeFloat<T: BinaryFloatingPoint>(_ value: T) throws -> String {
        if let f = value as? Float {
            return String(f)
        } else if let d = value as? Double {
            return String(d)
        } else {
            fatalError("Someone didn't update serializeFloat() when they updated serializeValue()'s type checks") // eww
        }
    }
    
    private static func serializeString(_ value: String) throws -> String {
        switch value.rangeOfCharacter(from: SQLSerialization.notIdentifier) {
        case .none:
            return value
        case .some:
            return "'" + value.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "'", with: "\\'") + "'"
        }
    }
    
    private static func serializeBool(_ value: Bool) throws -> String {
        return value ? "TRUE" : "FALSE"
    }
    
}
