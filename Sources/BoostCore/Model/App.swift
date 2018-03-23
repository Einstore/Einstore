//
//  App.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL
import DbCore
import ApiCore


public typealias Apps = [App]


final public class App: DbCoreModel {
    
    public enum Platform: String, Codable, KeyStringDecodable, PostgreSQLType {
        
        case unknown
        case ios = "ios"
        case tvos = "tvos"
        case url = "url"
        case simulator = "simulator"
        case android = "android"
        case macos = "macos"
        case windows = "windows"
        
        public static var keyStringTrue: App.Platform = .unknown
        public static var keyStringFalse: App.Platform = .unknown
        
        public var fileExtension: String {
            switch self {
            case .ios:
                return "ipa"
            case .android:
                return "apk"
            default:
                return "app.boost"
            }
        }
        
        public var mime: String {
            switch self {
            case .ios:
                return "application/octet-stream"
            case .android:
                return "application/vnd.android.package-archive"
            default:
                return "application/unknown"
            }
        }
        
        // MARK: PostgreSQLType stuff n magic
        
        public static var postgreSQLDataType: PostgreSQLDataType = .varchar
        public static var postgreSQLDataArrayType: PostgreSQLDataType = .varchar
        
        public static func convertFromPostgreSQLData(_ data: PostgreSQLData) throws -> App.Platform {
            guard let data = data.data, let stringValue = String.init(data: data, encoding: .utf8) else {
                return .unknown
            }
            return Platform(rawValue: stringValue) ?? .unknown
        }
        
        public func convertToPostgreSQLData() throws -> PostgreSQLData {
            return PostgreSQLData(type: .varchar, format: .text, data: rawValue.data(using: .utf8))
        }
        
    }
    
    public struct Overview: Content {
        public var id: DbCoreIdentifier
        public var identifier: String
        public var count: Int
    }
    
    public static var idKey: WritableKeyPath<App, DbCoreIdentifier?> = \App.id
    
    public var id: DbCoreIdentifier?
    public var teamId: DbCoreIdentifier?
    public var name: String
    public var identifier: String
    public var version: String
    public var build: String
    public var platform: Platform
    //public var platform: String
    public var created: Date?
    public var modified: Date?
    public var info: String?
    public var hasIcon: Bool
    
    enum CodingKeys: String, CodingKey {
        case id
        case teamId = "team_id"
        case name
        case identifier
        case version
        case build
        case platform
        case created
        case modified
        case info
        case hasIcon = "icon"
    }


    public init(id: DbCoreIdentifier? = nil, teamId: DbCoreIdentifier?, name: String, identifier: String, version: String, build: String, platform: Platform, info: String? = nil, hasIcon: Bool = false) {
        self.id = id
        self.teamId = teamId
        self.name = name
        self.identifier = identifier
        self.version = version
        self.build = build
        self.platform = platform
        self.created = Date()
        self.modified = Date()
        self.info = info
        self.hasIcon = hasIcon
    }
    
}

// MARK: - Relationships

extension App {
    
    var tags: Siblings<App, Tag, AppTag> {
        return siblings()
    }
    
    var downloadKeys: Children<App, DownloadKey> {
        return children(\.appId)
    }
    
}

// MARK: - Migrations

extension App: Migration {
    
    public static func prepare(on connection: DbCoreConnection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema) in
            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: DbCoreColumnType.id(), name: CodingKeys.teamId.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(140), name: CodingKeys.name.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(140), name: CodingKeys.identifier.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(20), name: CodingKeys.version.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(20), name: CodingKeys.build.stringValue)
            schema.addField(type: DbCoreColumnType.varChar(10), name: CodingKeys.platform.stringValue)
            schema.addField(type: DbCoreColumnType.datetime(), name: CodingKeys.created.stringValue)
            schema.addField(type: DbCoreColumnType.datetime(), name: CodingKeys.modified.stringValue)
            schema.addField(type: DbCoreColumnType.text(), name: CodingKeys.info.stringValue, isOptional: true)
            schema.addField(type: DbCoreColumnType.bool(), name: CodingKeys.hasIcon.stringValue)
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(App.self, on: connection)
    }
    
}

