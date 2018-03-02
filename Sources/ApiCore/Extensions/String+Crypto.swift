//
//  String+Crypto.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 14/01/2018.
//

import Foundation
import Vapor
import Crypto


extension String {
    
    public func passwordHash(_ req: Request) throws -> String {
        if req.environment == .production {
            let result: Data = try BCrypt.make(message: self)
            guard let hashedString = String(bytes: result, encoding: .utf8) else {
                fatalError("Should never happen!")
            }
            return hashedString
        } else {
            return self
        }
    }
    
    public var base64Decoded: String? {
        guard let data = try? Base64Decoder().decode(string: self) else {
            return nil
        }
        let string = String(data: data, encoding: .utf8)
        return string
    }
    
    public var md5: String? {
        let data = MD5.hash(self)
        return String(data: data, encoding: .utf8)
    }
    
}
