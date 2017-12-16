//
//  String+Crypto.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 13/12/2017.
//

import Foundation
import Crypto


public extension String {
    
    public var passwordHash: String {
        return SHA256.hash(self).hexString
    }
    
}
