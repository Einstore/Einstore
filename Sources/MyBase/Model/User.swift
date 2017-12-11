//
//  User.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation


public struct User: Codable {
    
    var id: Int?
    var username: String
    var firstname: String
    var lastname: String
    var email: String
    var password: String?
    var registered: Date?
    
}
