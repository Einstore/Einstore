//
//  Apk.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import ApiCore
import DbCore
import SwiftShell


class Apk: BaseExtractor, Extractor {
    
    enum ApkExtractorError: Error {
        case missingManifestFile
    }
    
    private(set) var manifest: ApkManifest?
    
    private(set) var appPermissions: [String] = []
    private(set) var appFeatures: [String] = []
    
    // MARK: URL's
    
    var manifestFileUrl: URL {
        get {
            var manifestFileUrl: URL = extractedApkFolder
            manifestFileUrl.appendPathComponent("AndroidManifest.xml")
            return manifestFileUrl
        }
    }
    
    var extractedApkFolder: URL {
        get {
            var url: URL = archive
            url.appendPathComponent("Decoded")
            return url
        }
    }
    
    var apktoolUrl: URL {
        get {
            var url: URL = binUrl
            url.appendPathComponent("apktool_2.3.1.jar")
            return url
        }
    }
    
    var xml2jsonUrl: URL {
        get {
            var url: URL = binUrl
            url.appendPathComponent("xml2json.py")
            return url
        }
    }
    
    // MARK: Parsing
    
    private func getApplicationName() throws {
        var pathUrl: URL = extractedApkFolder
        pathUrl.appendPathComponent("res")
        pathUrl.appendPathComponent("values")
        
        var xmlUrl = pathUrl
        xmlUrl.appendPathComponent("strings.xml")
        if FileManager.default.fileExists(atPath:xmlUrl.path) {
            var jsonUrl = pathUrl
            jsonUrl.appendPathComponent("strings.json")
            
            // Convert XML to JSON
            try runAndPrint(xml2jsonUrl.path, "-t", "xml2json", "-o", jsonUrl.path, xmlUrl.path)
            
            let strings = try ApkStrings.decode.fromJSON(file: jsonUrl)
            
            if let iconInfo: [String] = manifest?.manifest.application.nameAddress.components(separatedBy: "/"), iconInfo.count > 1 {
                appName = strings[iconInfo[1]]?.text
            }
        }
        
        if appName == nil {
            appName = file.lastPathComponent
        }
    }
    
    private func getOtherApplicationInfo() throws {
        appIdentifier = manifest?.manifest.application.identifier ?? manifest?.manifest.package
        versionLong = manifest?.manifest.platformBuildVersionName
        versionShort = manifest?.manifest.platformBuildVersionCode
    }
    
    private func getApplicationIcon() throws {
        appIconId = manifest?.manifest.application.icon
        if appIconId == nil {
            appIconId = manifest?.manifest.application.roundIcon
        }
        
        var pathUrl: URL = extractedApkFolder
        pathUrl.appendPathComponent("res")
        
        guard let iconInfo: [String] = appIconId?.replacingOccurrences(of: "@", with: "").components(separatedBy: "/") else {
            return
        }
        
        let folders: [String] = try FileManager.default.contentsOfDirectory(atPath: pathUrl.path).filter({ (folder) -> Bool in
            return folder.contains(iconInfo[0])
        }).sorted()
        for folder: String in folders {
            var iconBaseUrl: URL = pathUrl
            iconBaseUrl.appendPathComponent(folder)
            
            var iconUrl: URL = iconBaseUrl
            iconUrl.appendPathComponent(iconInfo[1])
            // QUESTION: Can this be uppercased after extraction?
            iconUrl.appendPathExtension("png")
            
            if FileManager.default.fileExists(atPath: iconUrl.path) {
                let data: Data = try Data(contentsOf: iconUrl)
                if data.count > (iconData?.count ?? 0) {
                    iconData = data
                }
            }
        }
    }
    
    private var appIconId: String?
    private var appNameId: String?
    
    func parseManifest() throws {
        guard FileManager.default.fileExists(atPath: manifestFileUrl.path) else {
            throw ApkExtractorError.missingManifestFile
        }
        
        let xmlUrl = archive.appendingPathComponent("Decoded/AndroidManifest.xml")
        if FileManager.default.fileExists(atPath:xmlUrl.path) {
            let jsonUrl = archive.appendingPathComponent("Decoded/AndroidManifest.json")
            try runAndPrint(xml2jsonUrl.path, "-t", "xml2json", "-o", jsonUrl.path, xmlUrl.path)
            
            do {
                manifest = try ApkManifest.decode.fromJSON(file: jsonUrl)
            } catch {
                print(error)
                throw error
            }
        }
    }
    
    func process(teamId: DbCoreIdentifier) throws -> Promise<App> {
        let promise = request.eventLoop.newPromise(App.self)
        
        do {
            // Extract archive
            try runAndPrint("java", "-jar", apktoolUrl.path, "d", "-sf", file.path, "-o", extractedApkFolder.path)
            
            // Parse manifest file
            try parseManifest()
            
            // Get info
            try getApplicationName()
            try getOtherApplicationInfo()
            try getApplicationIcon()
            
            let a = try app(platform: .android, teamId: teamId)
            promise.succeed(result: a)
        } catch {
            promise.fail(error: error)
        }
        
        return promise
    }
    
}
