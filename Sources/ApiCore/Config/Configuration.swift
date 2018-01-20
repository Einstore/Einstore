//
//  Configuration.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 21/01/2018.
//

import Foundation


public struct Configuration {
    
    public var maxUploadSize: Filesize = .megabyte(800)
    
    public var enableTeams: Bool = false
    public var enableUsers: Bool = false
    
    public var singleSignOn: (username: String, password: String)?
    
}


extension Configuration {
    
    public static func basic() -> Configuration {
        return Configuration()
    }
    
}
