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
    
    public static func fromJSON(fileNamed fileName: String, ofType type: String? = nil, inBundle bundle: Bundle? = nil) -> TestableType {
        var bundle = bundle
        if bundle == nil {
            bundle = Bundle.main
        }
        guard let filePath = bundle!.path(forResource: fileName, ofType: type) else {
            fatalError("Invalid filename")
        }
        let url = URL(fileURLWithPath: filePath)
        return fromJSON(file: url)
    }
    
    public static func fromJSON(file fileUrl: URL) -> TestableType {
        let data = try! Data(contentsOf: fileUrl)
        return fromJSON(data: data)
    }
    
    public static func fromJSON(string: String) -> TestableType {
        guard let data = string.data(using: .utf8) else {
            fatalError("Invalid string")
        }
        return fromJSON(data: data)
    }
    
    public static func fromJSON(data: Data) -> TestableType {
        let decoder = JSONDecoder()
        let object = try! decoder.decode(TestableType.self, from: data)
        return object
    }
    
}
