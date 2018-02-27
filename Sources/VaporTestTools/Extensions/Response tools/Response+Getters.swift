//
//  Response+Getters.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
@testable import Vapor


extension TestableProperty where TestableType: Response {
    
    public var contentSize: Int? {
        return element.content.body.count
    }
    
}
