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
    private(set) var platform: Platform? = .iOS
    private(set) var versionShort: String?
    private(set) var versionLong: String?
    
    private(set) var data: [String: String] = [:]
    
    
    // MARK: URL's
    
    var _extractedIpaFolder: URL?
    
    var extractedIpaFolder: URL {
        get {
            if _extractedIpaFolder == nil {
                var url: URL = self.archiveFolderUrl
                url.appendPathComponent("Payload")
                
                // TODO: Secure this a bit more!!!
                if let appName: String = try! FileManager.default.contentsOfDirectory(atPath: url.path).first {
                    url.appendPathComponent(appName)
                }
                self._extractedIpaFolder = url
            }
            return self._extractedIpaFolder!
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
        
        let _ = Terminal.execute("open", self.archiveFolderUrl.path)
    }
    
    // MARK: Parse
    
    private func parseProvisioning() throws {
        var embeddedFile: URL = self.extractedIpaFolder
        embeddedFile.appendPathComponent("embedded.mobileprovision")
        let provisioning: String = try String.init(contentsOfFile: embeddedFile.path, encoding: String.Encoding.utf8)
        if provisioning.contains("ProvisionsAllDevices") {
            self.data["provisioning"] = "enterprise"
        }
        else if provisioning.contains("ProvisionedDevices") {
            self.data["provisioning"] = "adhoc"
        }
        else {
            self.data["provisioning"] = "appstore"
        }
    }
    
    func parse() throws {
        try self.parseProvisioning()
    }
    
    // MARK: Data conversion
    
    func toJSON() throws -> JSON {
        var data: Node = try Decoder.basicData(decoder: self)
        data["data"] = try self.data.makeNode()
        return JSON(data)
    }
    
}
