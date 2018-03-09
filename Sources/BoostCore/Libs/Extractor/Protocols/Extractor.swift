//
//  Extractor.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import ErrorsCore
import ApiCore
import DbCore
import FileCore


enum ExtractorError: FrontendError {
    case unsupportedFile
    case invalidAppContent
    case errorSavingFile
    
    public var code: String {
        return "app_error"
    }
    
    public var status: HTTPStatus {
        switch self {
        default:
            return .preconditionFailed
        }
    }
    
    public var description: String {
        switch self {
        case .unsupportedFile:
            return "Invalid file type"
        case .invalidAppContent:
            return "Invalid or unsupported app content"
        case .errorSavingFile:
            return "Unable to save app file on the server"
        }
    }
}


protocol Extractor {
    
    var file: URL { get }
    var archive: URL { get }
    
    var iconData: Data? { get }
    var appName: String? { get }
    var appIdentifier: String? { get }
    var versionShort: String? { get }
    var versionLong: String? { get }
    
    init(file: URL, request: Request) throws
    func process(teamId: DbCoreIdentifier) throws -> Promise<App>
    
}


extension Extractor {
    
    var binUrl: URL {
        let config = DirectoryConfig.detect()
        var url: URL = URL(fileURLWithPath: config.workDir).appendingPathComponent("Resources")
        url.appendPathComponent("bin")
        return url
    }
    
    func app(platform: App.Platform, teamId: DbCoreIdentifier) throws -> App {
        guard let appName = appName, let appIdentifier = appIdentifier else {
            throw ExtractorError.invalidAppContent
        }
        // TODO: Add info which will be all the decompiled data together!!
        let app = App(teamId: teamId, name: appName, identifier: appIdentifier, version: versionLong ?? "0.0", build: versionShort ?? "0", platform: platform, hasIcon: (iconData != nil))
        return app
    }
    
    func save(_ app: App, request req: Request, _ fileHandler: FileHandler) throws -> Future<Void> {
        var saves: [Future<Void>] = []
        guard let path = app.appPath, let folder = app.targetFolderPath else {
            throw ExtractorError.errorSavingFile
        }
        
        try Boost.storageFileHandler.createFolderStructure(url: folder)
        
        let tempFile = App.tempAppFile(on: req)
        saves.append(try fileHandler.move(from: tempFile, to: path))
        if let iconData = iconData, let path = app.iconPath?.path {
            saves.append(try fileHandler.save(data: iconData, to: path))
        }
        return saves.flatten().map(to: Void.self) { _ in
            try self.cleanUp()
        }
    }
    
    // MARK: Cleaning
    
    func cleanUp() throws {
        try Boost.tempFileHandler.delete(url: archive)
    }
    
}
