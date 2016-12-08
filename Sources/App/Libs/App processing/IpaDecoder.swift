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
    
    private(set) var iconData: Data?
    private(set) var appName: String?
    private(set) var appIdentifier: String?
    private(set) var platform: Platform?
    private(set) var versionShort: String?
    private(set) var versionLong: String?
    
    // MARK: Prepare
    
    func prepare() throws {
        try super.saveToArchive()
        
        // Extract archive
        let result: TerminalResult = Terminal.execute("/usr/bin/env", "unzip", self.archiveFileUrl.path, "-d", self.archiveFolderUrl.path)
        if result.exitCode != 0 {
            throw BoostError(.unarchivingFailed)
        }
    }
    
    // MARK: Parse
    
    func parse() throws {
        
    }
    
    // MARK: Data conversion
    
    func toJSON() throws -> JSON {
        return JSON([])
    }
    
}
