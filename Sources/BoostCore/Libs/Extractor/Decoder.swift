//
//  Decoder.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 15/01/2018.
//

import Foundation


class BaseDecoder {
    
    var iconData: Data?
    var appName: String?
    var appIdentifier: String?
    var platform: App.Platform?
    var versionShort: String?
    var versionLong: String?
    
    var data: [String: Any] = [:]
    
    var file: URL
    var archive: URL
    
    let sessionUUID: String = UUID().uuidString
    
    // MARK: Initialization
    
    required init(file: URL) throws {
        self.file = file
        
        let path = "/tmp"
        archive = URL(fileURLWithPath: path)
        archive.appendPathComponent("extracted")
        archive.appendPathComponent(sessionUUID)
        
        try FileManager.default.createDirectory(at: archive, withIntermediateDirectories: true)
    }
    
}
