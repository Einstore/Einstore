//
//  IpaDecoder.swift
//  Boost
//
//  Created by Ondrej Rafaj on 02/12/2016.
//
//

import Foundation
import Vapor


final class IpaDecoder: Decoder, DecoderProtocol {
    
    
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
    
    // MARK: Prepare
    
    func prepare() throws {
        try super.saveToArchive()
        
        // Extract archive
        let result: TerminalResult = Terminal.execute("/usr/bin/env", "unzip", self.archiveFileUrl.path, "-d", self.archiveFolderUrl.path)
        if result.exitCode != 0 {
            throw BoostError(.unarchivingFailed)
        }
    }
    
    func parse() throws {
        
    }
    
}
