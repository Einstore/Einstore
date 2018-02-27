//
//  String+Testable.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation


extension TestableProperty where TestableType == String {
    
    public func asData() -> Data? {
        let data = element.data(using: .utf8)
        return data
    }
    
}
