//
//  Request+Tools.swift
//  Boost
//
//  Created by Ondrej Rafaj on 28/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
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
            else if let token = self.query?["auth"] {
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
