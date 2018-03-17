//
//  Install.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 15/03/2018.
//

import Foundation
import Vapor
import SettingsCore


class Install {
    
    static func make(on req: Request) throws -> Future<Void> {
        return [
            Setting(name: "style_header_color", config: "color").save(on: req).flatten(),
            Setting(name: "style_header_background_color", config: "color").save(on: req).flatten(),
            Setting(name: "style_primary_action_color", config: "color").save(on: req).flatten(),
            Setting(name: "style_primary_action_background_color", config: "color").save(on: req).flatten()
            ].flatten(on: req)
    }
    
}
