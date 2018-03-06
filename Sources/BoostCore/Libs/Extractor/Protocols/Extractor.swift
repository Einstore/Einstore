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
        }
    }
}


protocol Extractor {
    
    var file: URL { get }
    var archive: URL { get }
    var sessionUUID: String { get }
    
    var iconData: Data? { get }
    var appName: String? { get }
    var appIdentifier: String? { get }
    var versionShort: String? { get }
    var versionLong: String? { get }
    
    init(file: URL) throws
    func process(teamId: DbCoreIdentifier) throws -> Promise<App>
    func cleanUp() throws
    
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
        let app = App(teamId: teamId, name: appName, identifier: appIdentifier, version: versionLong ?? "0.0", build: versionShort ?? "0", platform: platform)
        return app
    }
    
    func save(_ app: App, _ fileHandler: Handler) throws -> Future<Void> {
        var saves: [Future<Void>] = []
        saves.append(try fileHandler.upload(file: file.path, destination: app.fileName))
        if let iconData = iconData {
            saves.append(try fileHandler.upload(file: iconData, destination: app.iconName))
        }
        return saves.flatten()
    }
    
}
