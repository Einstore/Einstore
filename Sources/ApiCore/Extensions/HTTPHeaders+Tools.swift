//
//  HTTPHeaders+Tools.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 14/01/2018.
//

import Foundation
import Vapor


extension HTTPHeaders {
    
    public var authorizationToken: String? {
        guard let token = self[HTTPHeaderName.authorization] else {
            return nil
        }
        let parts = token.split(separator: " ")
        guard parts.count == 2 else {
            return nil
        }
        return String(parts[1])
    }
    
}
