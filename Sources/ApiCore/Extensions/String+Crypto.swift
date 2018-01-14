//
//  String+Crypto.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 14/01/2018.
//

import Foundation
import Crypto


extension String {
    
    public var passwordHash: String {
        guard let result: Data = try? BCrypt.make(message: self), let hashedString = String(bytes: result, encoding: .utf8) else {
            fatalError("This should never happen")
        }
        return hashedString
    }
    
    public var base64Decoded: String? {
        guard let data = try? Base64Decoder().decode(string: self) else {
            return nil
        }
        let string = String(data: data, encoding: .utf8)
        return string
    }
    
}
