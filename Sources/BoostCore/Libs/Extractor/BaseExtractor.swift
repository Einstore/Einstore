//
//  Decoder.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 15/01/2018.
//

import Foundation


class BaseExtractor {
    
    var iconData: Data?
    var appName: String?
    var appIdentifier: String?
    var versionShort: String?
    var versionLong: String?
    
    var infoData: [String: Codable] = [:]
    
    var file: URL
    var archive: URL
    
    let sessionUUID: String = UUID().uuidString
    
    // MARK: Initialization
    
    required init(file: URL) throws {
        self.file = file
        
        archive = URL(fileURLWithPath: "/tmp/Boost")
        archive.appendPathComponent("extracted")
        archive.appendPathComponent(sessionUUID)
        
        print("Archive: \(sessionUUID)")
        
        try FileManager.default.createDirectory(at: archive, withIntermediateDirectories: true)
    }
    
    static func decoder(file: String, platform: App.Platform) throws -> Extractor {
        let url = URL(fileURLWithPath: file)
        switch platform {
        case .ios:
            return try Ipa(file: url)
        case .android:
            return try Apk(file: url)
        default:
            throw ExtractorError.unsupportedFile
        }
    }
    
}
