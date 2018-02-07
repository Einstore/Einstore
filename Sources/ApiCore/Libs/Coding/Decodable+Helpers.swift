//
//  Decodable+Helpers.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 07/02/2018.
//

import Foundation


public struct DecodableProperty<ModelType> { }


extension DecodableProperty where ModelType: Decodable {
    
    public static func fromJSON(file fileUrl: URL) throws -> ModelType {
        let data = try Data(contentsOf: fileUrl)
        return try fromJSON(data: data)
    }
    
    public static func fromJSON(path: String) throws -> ModelType {
        let url = URL(fileURLWithPath: path)
        return try fromJSON(file: url)
    }
    
    public static func fromJSON(string: String) throws -> ModelType {
        guard let data = string.data(using: .utf8) else {
            fatalError("Invalid string")
        }
        return try fromJSON(data: data)
    }
    
    public static func fromJSON(data: Data) throws -> ModelType {
        let decoder = JSONDecoder()
        let object = try decoder.decode(ModelType.self, from: data)
        return object
    }
    
}


public protocol DecodableHelper {
    associatedtype ModelType
    static var decode: DecodableProperty<ModelType>.Type { get }
}


public extension DecodableHelper {
    
    public static var decode: DecodableProperty<ModelType>.Type {
        return DecodableProperty<ModelType>.self
    }
    
}


public protocol JSONDecodable: Decodable, DecodableHelper { }
