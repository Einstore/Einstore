//
//  App+Filename.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 21/02/2018.
//

import Foundation


extension App {
    
    public var iconName: String {
        guard let id = id else {
            fatalError("fileName should not be called on an app that hasn't been created yet")
        }
        return "\(id.uuidString)/icon.png"
    }
    
    public var fileName: String {
        guard let id = id else {
            fatalError("fileName should not be called on an app that hasn't been created yet")
        }
        return "\(id.uuidString)/app.boost"
    }
    
}
