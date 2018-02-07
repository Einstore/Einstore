//
//  Extractor.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import ApiErrors
import ApiCore
import DbCore


enum ExtractorError: FrontendError {
    case invalidAppContent
    
    public var code: String {
        return "app_error"
    }
    
    public var status: HTTPStatus {
        return .unsupportedMediaType
    }
    
    public var description: String {
        switch self {
        case .invalidAppContent:
            return "Invalid or unsupported app content"
        }
    }
}


protocol Extractor {
    
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
    
//    func app() throws -> App {
//        let app = App(id: nil, name: appName ?? "")
//
//        return app
//    }
    
}
