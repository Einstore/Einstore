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
import MailCore


public struct BoostConfig {
    
    public var serverBaseUrl: String = "http://localhost:8080/"
    
    public var database: DatabaseConfig? = nil
    
    public var tempFileConfig = TempFileConfig()
    public var storageFileConfig = StorageFileConfig()
    
    public var mail: Mailer.Config = .none
    
    public init() {
        
    }
    
}
