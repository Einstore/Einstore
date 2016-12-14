//
//  Decoder.swift
//  Boost
//
//  Created by Ondrej Rafaj on 05/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor


class Decoder {
    
    
    private(set) var multiPartFile: Multipart
    
    let sessionUUID: String = UUID().uuidString
    
    
    // MARK: URL's
    
    var archiveFolderUrl: URL {
        get {
            var archiveUrl: URL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
            archiveUrl.appendPathComponent("BoostAppStore")
            archiveUrl.appendPathComponent(self.sessionUUID)
            return archiveUrl
        }
    }
    
    var archiveFileUrl: URL {
        get {
            var archiveUrl: URL = self.archiveFolderUrl
            archiveUrl.appendPathComponent("app.zip")
            return archiveUrl
        }
    }
    
    // MARK: Initialization
    
    init(_ multipart: Multipart) {
        self.multiPartFile = multipart
    }
    
    static func decoderForFile(multipart: Multipart) -> DecoderProtocol? {
        guard let fileName: String = multipart.file?.name?.lowercased() else {
            return nil
        }
        let fileExtension: String = URL.init(fileURLWithPath: fileName).pathExtension
        switch fileExtension {
        case "ipa":
            return IpaDecoder(multipart)
        case "apk":
            return ApkDecoder(multipart)
        case "app":
            return nil
        case "exe":
            return nil
        default:
            return nil
        }
    }
    
    // MARK: Working with files
    
    func saveToArchive() throws {
        // Save data
        do {
            try FileManager.default.createDirectory(at: self.archiveFolderUrl, withIntermediateDirectories: true, attributes: nil)
        }
        catch {
            throw BoostError(.cacheNotAccessible)
        }
        
        guard let file: Multipart.File = self.multiPartFile.file else {
            throw BoostError(.noFile)
        }
        
        let data: Data = Data(bytes: file.data)
        
        do {
            try data.write(to: self.archiveFileUrl)
        }
        catch {
            throw BoostError(.cacheNotAccessible)
        }
    }
    
    func cleanUp() throws {
        try FileManager.default.removeItem(at: self.archiveFolderUrl)
    }
    
    // MARK: JSONising
    
    static func basicData(decoder: DecoderProtocol) throws -> Node {
        var data: [String: String] = [:]
        data["name"] = decoder.appName ?? ""
        data["identifier"] = decoder.appIdentifier ?? ""
        data["platform"] = decoder.platform!.rawValue
        data["version-short"] = decoder.versionShort ?? ""
        data["version-long"] = decoder.versionLong ?? ""
        return try data.makeNode()
    }
    
}
