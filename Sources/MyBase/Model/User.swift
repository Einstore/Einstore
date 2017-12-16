//
//  User.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 11/12/2017.
//

import Foundation


public struct User: Codable {
    
    public var id: Int?
    public var firstname: String
    public var lastname: String
    public var email: String
    public var password: String?
    public var token: String?
    public var expires: Date?
    public var registered: Date
    public var disabled: Bool
    public var su: Bool
    
}
