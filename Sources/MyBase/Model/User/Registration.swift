//
//  Registration.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 21/12/2017.
//

import Foundation


public struct Registration: Codable {
    
    public var firstname: String
    public var lastname: String
    public var email: String
    public var password: String
    
}


extension Registration {
    
    var newUser: User {
        let token = UUID().uuidString.passwordHash
        let user = User(id: nil, firstname: firstname, lastname: lastname, email: email, password: password.passwordHash, token: token, expires: nil, registered: Date(), disabled: true, su: false)
        return user
    }
}

