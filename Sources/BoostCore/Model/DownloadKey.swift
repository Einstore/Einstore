//
//  DownloadKey.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 22/02/2018.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL
import DbCore
import ApiCore


public typealias DownloadKeys = [DownloadKey]


final public class DownloadKey: DbCoreModel {
    
    public struct Token: Codable {
        public var token: String
    }
    
    public struct Public: Content {
        let appId: DbCoreIdentifier
        var token: String
        let plist: String
        let file: String
        let ios: String
        
        init(downloadKey: DownloadKey, request req: Request) {
            self.token = downloadKey.token
            
            guard let url = URL(string: Boost.config.serverBaseUrl)?.appendingPathComponent("apps") else {
                fatalError("Server URL is not properly configured")
            }
            self.plist = url.appendingPathComponent("plist?token=\(downloadKey.token)").absoluteString
            self.file = url.appendingPathComponent("file?token=\(downloadKey.token)").absoluteString
            self.ios = "itms-services://?action=download-manifest&url=\(self.plist)"
            self.appId = downloadKey.appId
        }
        
        enum CodingKeys: String, CodingKey {
            case appId = "app_id"
            case token
            case plist
            case file
            case ios
        }
    }
    
    public static var idKey: WritableKeyPath<DownloadKey, DbCoreIdentifier?> = \DownloadKey.id
    
    public var id: DbCoreIdentifier?
    public var appId: DbCoreIdentifier
    public var token: String
    public var added: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case appId = "app_id"
        case token
        case added
    }
    
    public init(id: DbCoreIdentifier? = nil, appId: DbCoreIdentifier) {
        self.id = id
        self.appId = appId
        self.token = UUID().uuidString
        self.added = Date()
    }
    
}

// MARK: - Relationships

extension DownloadKey {
    
    var app: Parent<DownloadKey, App> {
        return parent(\.appId)
    }
    
}

// MARK: - Migrations

extension DownloadKey: Migration {
    
    public static func prepare(on connection: DbCoreConnection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema) in
            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.appId.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(64), name: CodingKeys.token.stringValue)
            schema.addField(type: DbCoreColumnType.datetime(), name: CodingKeys.added.stringValue)
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(DownloadKey.self, on: connection)
    }
    
}
