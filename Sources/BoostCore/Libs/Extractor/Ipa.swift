//
//  Ipa.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import SwiftShell


class Ipa: BaseDecoder, Extractor {
    
    var payload: URL {
        var url = self.archive
        url.appendPathComponent("Payload")
        // TODO: Secure this a bit more?
        if let appName: String = try! FileManager.default.contentsOfDirectory(atPath: url.path).first {
            url.appendPathComponent(appName)
        }
        return url
    }
    
    // MARK: Processing
    
    func process() throws -> Future<App?> {
        platform = .iOS
        
        let promise = Promise<App?>()
        
        // TODO: Make async
//        Thread.async {
            try runAndPrint("unzip", "-o", file.path, "-d", archive.path)
            try parse()
            try cleanUp()
            
            // TODO: Make app and return it
            promise.complete(nil)
//        }
        
        return promise.future
    }
    
    // MARK: Cleaning
    
    func cleanUp() throws {
        try FileManager.default.removeItem(at: self.archive)
    }
    
}

// MARK: - Parsing

extension Ipa {
    
    private func parseProvisioning() throws {
        var embeddedFile: URL = payload
        embeddedFile.appendPathComponent("embedded.mobileprovision")
        let provisioning: String = try String(contentsOfFile: embeddedFile.path, encoding: String.Encoding.utf8)
        if provisioning.contains("ProvisionsAllDevices") {
            data["provisioning"] = "enterprise"
        }
        else if provisioning.contains("ProvisionedDevices") {
            data["provisioning"] = "adhoc"
        }
        else {
            data["provisioning"] = "appstore"
        }
    }
    
    private func parseInfoPlistFile(_ plist: [String: AnyObject]) throws {
        // Bundle ID
        guard let bundleId = plist["CFBundleIdentifier"] as? String else {
            throw ExtractorError.invalidAppContent
        }
        appIdentifier = bundleId
        
        // Name
        var appName: String? = plist["CFBundleDisplayName"] as? String
        if appName == nil {
            appName = plist["CFBundleName"] as? String
        }
        guard appName != nil else {
            throw ExtractorError.invalidAppContent
        }
        self.appName = appName
        
        // Versions
        versionLong = plist["CFBundleShortVersionString"] as? String
        versionShort = plist["CFBundleVersion"] as? String
        
        // Other plist data
        if let minOS: String = plist["MinimumOSVersion"] as? String {
            data["minOS"] = minOS
        }
        if let orientationPhone: [String] = plist["UISupportedInterfaceOrientations"] as? [String] {
            data["orientationPhone"] = orientationPhone
        }
        if let orientationTablet: [String] = plist["UISupportedInterfaceOrientations~ipad"] as? [String] {
            data["orientationTablet"] = orientationTablet
        }
        if let deviceCapabilities: [String] = plist["UIRequiredDeviceCapabilities"] as? [String] {
            data["deviceCapabilities"] = deviceCapabilities
        }
        if let deviceFamily: [String] = plist["UIDeviceFamily"] as? [String] {
            data["deviceFamily"] = deviceFamily
        }
    }
    
    private func checkIcons(_ iconInfo: [String: AnyObject], files: [String]) throws {
        guard let primaryIcon: [String: AnyObject] = iconInfo["CFBundlePrimaryIcon"] as? [String: AnyObject] else {
            return
        }
        guard let icons: [String] = primaryIcon["CFBundleIconFiles"] as? [String] else {
            return
        }
        
        for icon: String in icons {
            for file: String in files {
                if file.contains(icon) {
                    var fileUrl: URL = payload
                    fileUrl.appendPathComponent(file)
                    let iconData: Data = try Data(contentsOf: fileUrl)
                    if iconData.count > (self.iconData?.count ?? 0) {
                        self.iconData = iconData
                    }
                }
            }
        }
    }
    
    private func parseIcon(_ plist: [String: AnyObject]) throws {
        let files: [String] = try FileManager.default.contentsOfDirectory(atPath: payload.path)
        if let iconInfo: [String: AnyObject] = plist["CFBundleIcons"] as? [String: AnyObject] {
            try checkIcons(iconInfo, files: files)
        }
        if let iconsInfoTablet: [String: AnyObject] = plist["CFBundleIcons~ipad"] as? [String: AnyObject] {
            try checkIcons(iconsInfoTablet, files: files)
        }
    }
    
    func parse() throws {
        // TODO: Fix!!!!
        //try parseProvisioning()
        
        var embeddedFile: URL = payload
        embeddedFile.appendPathComponent("Info.plist")
        
        guard let plist: [String: AnyObject] = try [String: AnyObject].fill(fromPlist: embeddedFile) else {
            throw ExtractorError.invalidAppContent
        }
        
        try parseInfoPlistFile(plist)
        try parseIcon(plist)
    }
    
}
