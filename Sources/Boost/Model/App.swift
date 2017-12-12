//
//  App.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation


struct App: Codable {
    
    enum Platform: Int, Codable {
        case file = 0
        case ios = 1
        case tvos = 2
        case android = 3
    }
    
    let id: Int?
    let teamId: Int?
    let name: String
    let identifier: String
    let version: String
    let build: String
    let platform: Platform
    let created: Date?
    let modified: Date?
    let availableToAll: Bool = false
    
    enum CodingKeys: String, CodingKey {
        case id
        case teamId = "team_id"
        case name
        case identifier
        case version
        case build
        case platform
        case created
        case modified
        case availableToAll = "basic"
    }
    
}
