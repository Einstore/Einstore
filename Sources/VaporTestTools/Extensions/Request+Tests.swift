//
//  Request+Tests.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import Vapor



extension TestableProperty where TestableType: Request {
    
    public static var make: TestableProperty<TestableType>.Type {
        return TestableProperty<TestableType>.self
    }
    
}


extension TestableProperty where TestableType: Request {
    
    public static func new() {
        
    }
    
}


extension Request: Testable { }
