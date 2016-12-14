//
//  IpaDecoder.swift
//  Boost
//
//  Created by Ondrej Rafaj on 02/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
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
    
    private(set) var data: [String: Node] = [:]
    
    
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
        self.platform = .iOS
        
        try super.saveToArchive()
        
        // Extract archive
        let result: TerminalResult = Terminal.execute("/usr/bin/env", "unzip", self.archiveFileUrl.path, "-d", self.archiveFolderUrl.path)
        if result.exitCode != 0 {
            throw BoostError(.unarchivingFailed)
        }
        
        //let _ = Terminal.execute("open", self.archiveFolderUrl.path)
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
    
    private func parseInfoPlistFile(_ plist: NSDictionary) throws {
        // Bundle ID
        guard let bundleId = plist["CFBundleIdentifier"] as? String else {
            throw BoostError(.invalidAppContent)
        }
        self.appIdentifier = bundleId
        
        // Name
        var appName: String? = plist["CFBundleDisplayName"] as? String
        if appName == nil {
            appName = plist["CFBundleName"] as? String
        }
        guard appName != nil else {
            throw BoostError(.invalidAppContent)
        }
        self.appName = appName
        
        // Versions
        self.versionLong = plist["CFBundleShortVersionString"] as? String
        self.versionShort = plist["CFBundleVersion"] as? String
        
        // Other plist data
        if let minOS: String = plist["MinimumOSVersion"] as? String {
            self.data["minOS"] = minOS.makeNode()
        }
        if let orientationPhone: [String] = plist["UISupportedInterfaceOrientations"] as? [String] {
            self.data["orientationPhone"] = try orientationPhone.makeNode()
        }
        if let orientationTablet: [String] = plist["UISupportedInterfaceOrientations~ipad"] as? [String] {
            self.data["orientationTablet"] = try orientationTablet.makeNode()
        }
        if let deviceCapabilities: [String] = plist["UIRequiredDeviceCapabilities"] as? [String] {
            self.data["deviceCapabilities"] = try deviceCapabilities.makeNode()
        }
        if let deviceFamily: [String] = plist["UIDeviceFamily"] as? [String] {
            self.data["deviceFamily"] = try deviceFamily.makeNode()
        }
    }
    
    private func checkIcons(_ iconInfo: NSDictionary, files: [String]) throws {
        guard let primaryIcon: NSDictionary = iconInfo["CFBundlePrimaryIcon"] as? NSDictionary else {
            return
        }
        guard let icons: [String] = primaryIcon["CFBundleIconFiles"] as? [String] else {
            return
        }
        
        for icon: String in icons {
            for file: String in files {
                if file.contains(icon) {
                    var fileUrl: URL = self.extractedIpaFolder
                    fileUrl.appendPathComponent(file)
                    let iconData: Data = try Data.init(contentsOf: fileUrl)
                    if iconData.count > (self.iconData?.count ?? 0) {
                        self.iconData = iconData
                    }
                }
            }
        }
    }
    
    private func parseIcon(_ plist: NSDictionary) throws {
        let files: [String] = try FileManager.default.contentsOfDirectory(atPath: self.extractedIpaFolder.path)
        if let iconInfo: NSDictionary = plist["CFBundleIcons"] as? NSDictionary {
            try self.checkIcons(iconInfo, files: files)
        }
        if let iconsInfoTablet: NSDictionary = plist["CFBundleIcons~ipad"] as? NSDictionary {
            try self.checkIcons(iconsInfoTablet, files: files)
        }
    }
    
    func parse() throws {
        // TODO: Fix!!!!
        //try self.parseProvisioning()
        
        var embeddedFile: URL = self.extractedIpaFolder
        embeddedFile.appendPathComponent("Info.plist")
        
        guard let plist: NSDictionary = NSDictionary(contentsOfFile: embeddedFile.path) else {
            throw BoostError(.invalidAppContent)
        }
        
        try self.parseInfoPlistFile(plist)
        try self.parseIcon(plist)
    }
    
    // MARK: Data conversion
    
    func toJSON() throws -> JSON {
        var data: Node = try Decoder.basicData(decoder: self)
        data["data"] = try self.data.makeNode()
        return JSON(data)
    }
    
}
