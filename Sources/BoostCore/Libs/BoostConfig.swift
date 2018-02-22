//
//  BoostConfig.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 08/02/2018.
//

import Foundation
import DbCore
import Fluent
import FileCore


public struct BoostConfig {
    public var database: DatabaseConfig? = nil
    public var fileHandler: Handler
    
    public init(fileHandler: Handler) {
        self.fileHandler = fileHandler
    }
}
