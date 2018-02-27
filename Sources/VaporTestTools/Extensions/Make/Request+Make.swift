//
//  Request+Make.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import Vapor


extension TestableProperty where TestableType: Request {
    
    public static var http: TestableProperty<HTTPRequest>.Type {
        return TestableProperty<HTTPRequest>.self
    }
    
}
