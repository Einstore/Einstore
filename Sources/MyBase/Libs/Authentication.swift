//
//  Authentication.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation
import Vapor


public class Authentication {
    
    public static func me(_ request: Request) -> User? {
        return User(id: 1, username: "admin", firstname: "Super", lastname: "Admin", email: "admin@liveui.io", password: "wtf?!", registered: Date())
    }
    
    public static func team(_ request: Request) -> Team? {
        return Team(id: 1, name: "Admin team")
    }
    
}
