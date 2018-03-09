//
//  Decoder.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 15/01/2018.
//

import Foundation
import Vapor


class BaseExtractor {
    
    var iconData: Data?
    var appName: String?
    var appIdentifier: String?
    var versionShort: String?
    var versionLong: String?
    
    var infoData: [String: Codable] = [:]
    
    var file: URL
    var archive: URL
    
    // MARK: Initialization
    
    required init(file: URL, request req: Request) throws {
        self.file = file
        self.archive = App.tempAppFolder(on: req)
        try Boost.tempFileHandler.createFolderStructure(url: self.archive)
    }
    
    static func decoder(file: String, platform: App.Platform, on req: Request) throws -> Extractor {
        let url = URL(fileURLWithPath: file)
        switch platform {
        case .ios:
            return try Ipa(file: url, request: req)
        case .android:
            return try Apk(file: url, request: req)
        default:
            throw ExtractorError.unsupportedFile
        }
    }
    
}
