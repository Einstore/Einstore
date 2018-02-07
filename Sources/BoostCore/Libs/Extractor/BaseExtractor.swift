//
//  Decoder.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 15/01/2018.
//

import Foundation


class BaseExtractor {
    
    enum BaseExtractorError: Error {
        case unsupportedFile
    }
    
    var iconData: Data?
    var appName: String?
    var appIdentifier: String?
    var versionShort: String?
    var versionLong: String?
    
    var data: [String: Any] = [:]
    
    var file: URL
    var archive: URL
    
    let sessionUUID: String = UUID().uuidString
    
    var binUrl: URL {
        get {
            // TODO: Make path to resources dynamic!!!!!
            var url: URL = URL(fileURLWithPath: "/Projects/Web/Boost/Resources/")
            url.appendPathComponent("bin")
            return url
        }
    }
    
    // MARK: Initialization
    
    required init(file: URL) throws {
        self.file = file
        
        let path = "/tmp"
        archive = URL(fileURLWithPath: path)
        archive.appendPathComponent("extracted")
        archive.appendPathComponent(sessionUUID)
        
        try FileManager.default.createDirectory(at: archive, withIntermediateDirectories: true)
    }
    
    static func decoder(file: String) throws -> Extractor {
        let url = URL(fileURLWithPath: file)
        let fileExtension: String = url.pathExtension
        switch fileExtension {
        case "ipa":
            return try Ipa(file: url)
        case "apk":
            return try Apk(file: url)
        default:
            throw BaseExtractorError.unsupportedFile
        }
    }
    
}
