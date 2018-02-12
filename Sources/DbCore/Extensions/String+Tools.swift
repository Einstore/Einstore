//
//  String+Tools.swift
//  DbCore
//
//  Created by Ondrej Rafaj on 12/02/2018.
//

import Foundation


extension String {
    
    func asBool() -> Bool? {
        switch self.lowercased() {
        case "true", "yes", "1":
            return true
        case "false", "no", "0":
            return false
        default:
            return nil
        }
    }
    
}


extension Optional where Wrapped == String {
    
    func asBool() -> Bool {
        switch self?.lowercased() {
        case "true", "yes", "1":
            return true
        case "false", "no", "0":
            return false
        default:
            return false
        }
    }
    
}

