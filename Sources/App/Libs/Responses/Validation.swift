//
//  Validation.swift
//  Boost
//
//  Created by Ondrej Rafaj on 29/11/2016.
//
//

import Foundation


enum ValidationType: String {
    case exists = "DataExists"
    case empty = "DataNotEmpty"
    case email = "DataValidEmail"
    case password = "DataValidPassword"
}


//class Name: ValidationSuite {
//    
//    static func validate(input value: String) throws {
//        let evaluation = OnlyAlphanumeric.self && Count.min(5) && Count.max(20)
//        try evaluation.validate(input: value)
//    }
//    
//}

struct Field {
    
    let name: String
    let validationType: ValidationType
    let errorMessage: String
    
}

struct ValidationError {
    
    let name: String
    let validationType: ValidationType
    let errorMessage: String
    
    init(field: Field) {
        self.name = field.name
        self.validationType = field.validationType
        self.errorMessage = field.errorMessage
    }
    
}
