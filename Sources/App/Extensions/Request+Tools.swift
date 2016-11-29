//
//  Request+Tools.swift
//  Boost
//
//  Created by Ondrej Rafaj on 28/11/2016.
//
//

import Vapor
import HTTP


extension Request {
    
    // MARK: Get token
    
    var tokenString: String? {
        get {
            if let token = self.headers["X-AuthToken"] {
                return token
            }
            if let token = self.query?["token"] {
                return token.string
            }
            return nil
        }
    }
    
    var token: Node? {
        get {
            return self.tokenString?.makeNode()
        }
    }
    
}
