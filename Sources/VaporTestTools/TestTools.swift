//
//  TestTools.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import Vapor


// MARK: Testable

public protocol Testable {
    
    associatedtype ObjectType
    var testable: TestableProperty<ObjectType> { get }
    static var testable: TestableProperty<ObjectType>.Type { get }
    
}


extension Testable {
    
    public var testable: TestableProperty<Self> {
        return TestableProperty(self)
    }
    
    public static var testable: TestableProperty<ObjectType>.Type {
        return TestableProperty<ObjectType>.self
    }
    
}

extension Request: Testable { }
extension HTTPRequest: Testable { }
extension Response: Testable { }
extension Application: Testable { }




