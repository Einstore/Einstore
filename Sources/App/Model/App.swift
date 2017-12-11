//
//  App.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation


struct App: Codable {
    
    enum Platform: Int, Codable {
        case ios
        case tvos
        case android
    }
    
    let id: Int?
    let name: String
    let identifier: String
    let platform: String
    
}
