//
//  ApkDecoder.swift
//  Boost
//
//  Created by Ondrej Rafaj on 02/12/2016.
//
//

import Foundation
import Vapor


final class ApkDecoder: Decoder, DecoderProtocol {
    
    
    // MARK: Protocol data
    
    var iconData: Data? {
        get {
            return nil
        }
    }
    
    var appName: String {
        get {
            return "App"
        }
    }
    
    var bundleId: String? {
        get {
            return "com.app-developer.app"
        }
    }
    
    var platform: Platform {
        get {
            return .android
        }
    }
    
    // MARK: URL's
    
    var manifestFileUrl: URL {
        get {
            var manifestFileUrl: URL = self.extractedApkFolder
            manifestFileUrl.appendPathComponent("AndroidManifest.xml")
            return manifestFileUrl
        }
    }
    
    var extractedApkFolder: URL {
        get {
            var url: URL = self.archiveFolderUrl
            url.appendPathComponent("Decoded")
            return url
        }
    }
    
    var apktoolUrl: URL {
        get {
            var url: URL = URL(fileURLWithPath: drop.resourcesDir)
            url.appendPathComponent("bin")
            url.appendPathComponent("apktool_2.2.1.jar")
            return url
        }
    }
    
    // MARK: Parsing
    
    func prepare() throws {
        try super.saveToArchive()
        
        // Extract archive
        let result: TerminalResult = Terminal.execute("java", "-jar", self.apktoolUrl.path, "d", self.archiveFileUrl.path, "-o", self.extractedApkFolder.path, "-f")
        
        let _ = Terminal.execute("open", self.archiveFolderUrl.path)
        
        if result.exitCode != 0 {
            throw BoostError(.unarchivingFailed)
        }
    }
    
    func parse() throws {
        guard FileManager.default.fileExists(atPath: self.manifestFileUrl.path) else {
            throw BoostError(.missingManifestFile)
        }
    }
    
}
