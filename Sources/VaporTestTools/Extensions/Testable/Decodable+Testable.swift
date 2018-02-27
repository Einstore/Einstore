//
//  Decodable+Testable.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation


extension TestableProperty where TestableType: Decodable {

    public static var make: TestableProperty<TestableType>.Type {
        return TestableProperty<TestableType>.self
    }
    
}


extension TestableProperty where TestableType: Decodable {
    
    public static func fromJSON(fileNamed fileName: String, ofType type: String? = nil, inBundle bundle: Bundle? = nil) throws -> TestableType {
        var bundle = bundle
        if bundle == nil {
            bundle = Bundle.main
        }
        guard let filePath = bundle!.path(forResource: fileName, ofType: type) else {
            fatalError("Invalid filename")
        }
        let url = URL(fileURLWithPath: filePath)
        return try fromJSON(file: url)
    }
    
    public static func fromJSON(file fileUrl: URL) throws -> TestableType {
        let data = try Data(contentsOf: fileUrl)
        return try fromJSON(data: data)
    }
    
    public static func fromJSON(string: String) throws -> TestableType {
        guard let data = string.data(using: .utf8) else {
            fatalError("Invalid string")
        }
        return try fromJSON(data: data)
    }
    
    public static func fromJSON(data: Data) throws -> TestableType {
        let decoder = JSONDecoder()
        let object = try decoder.decode(TestableType.self, from: data)
        return object
    }
    
}
