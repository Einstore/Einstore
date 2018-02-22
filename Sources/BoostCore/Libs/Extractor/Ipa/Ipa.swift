//
//  Ipa.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import SwiftShell
import ApiCore
import DbCore


class Ipa: BaseExtractor, Extractor {
    
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
    
    func process(teamId: DbCoreIdentifier) throws -> Promise<App> {
        let promise = Promise<App>()
        
        // TODO: Make async
//        runloop.zeromilisecondsTimer {
            do {
                try runAndPrint("unzip", "-o", self.file.path, "-d", self.archive.path)
                try self.parse()
                try self.cleanUp()
                
                let a = try app(platform: .iOS, teamId: teamId)
                promise.complete(a)
            } catch {
                promise.fail(error)
            }
//        }
        
        return promise
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
        // TODO: Fix by decoding the provisioning file!!!!
        guard let provisioning: String = try? String(contentsOfFile: embeddedFile.path, encoding: String.Encoding.utf8) else {
            return
        }
        if provisioning.contains("ProvisionsAllDevices") {
            infoData["provisioning"] = "enterprise"
        }
        else if provisioning.contains("ProvisionedDevices") {
            infoData["provisioning"] = "adhoc"
        }
        else {
            infoData["provisioning"] = "appstore"
        }
    }
    
    // TODO: Convert the implementation to use a Codable object
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
            infoData["minOS"] = minOS
        }
        if let orientationPhone: [String] = plist["UISupportedInterfaceOrientations"] as? [String] {
            infoData["orientationPhone"] = orientationPhone
        }
        if let orientationTablet: [String] = plist["UISupportedInterfaceOrientations~ipad"] as? [String] {
            infoData["orientationTablet"] = orientationTablet
        }
        if let deviceCapabilities: [String] = plist["UIRequiredDeviceCapabilities"] as? [String] {
            infoData["deviceCapabilities"] = deviceCapabilities
        }
        if let deviceFamily: [String] = plist["UIDeviceFamily"] as? [String] {
            infoData["deviceFamily"] = deviceFamily
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
        
        guard let iconData = iconData else {
            return
        }
        let iconUrl = archive.appendingPathComponent("icon.png")
        try iconData.write(to: iconUrl)
        
        // TODO: Normalize binary image
//        let normalize = binUrl.appendingPathComponent("normalize.py")
//        try runAndPrint(normalize.path, "-t", "xml2json", "-o", jsonUrl.path, xmlUrl.path)
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
        try parseProvisioning()
        
        var embeddedFile: URL = payload
        embeddedFile.appendPathComponent("Info.plist")
        
        guard let plist: [String: AnyObject] = try [String: AnyObject].fill(fromPlist: embeddedFile) else {
            throw ExtractorError.invalidAppContent
        }
        
        try parseInfoPlistFile(plist)
        try parseIcon(plist)
    }
    
}
