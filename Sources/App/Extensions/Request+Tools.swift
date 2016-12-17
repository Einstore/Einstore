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
    
    // MARK: Upload token
    
    var uploadTokenString: String? {
        get {
            if let token = self.headers["X-UploadToken"] {
                return token
            }
            else if let token = self.query?["token"] {
                return token.string
            }
            return nil
        }
    }
    
    var uploadToken: Node? {
        get {
            return self.uploadTokenString?.makeNode()
        }
    }
    
    // MARK: Auth tokens
    
    var authTokenString: String? {
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
    
    var authToken: Node? {
        get {
            return self.authTokenString?.makeNode()
        }
    }
    
}
