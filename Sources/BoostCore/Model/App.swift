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
    
    public enum Platform: String, Codable, KeyStringDecodable {
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
    }
    
    public static var idKey: WritableKeyPath<App, DbCoreIdentifier?> = \App.id
    
    public var id: DbCoreIdentifier?
    public var teamId: DbCoreIdentifier?
    public var name: String
    public var identifier: String
    public var version: String
    public var build: String
    //public var platform: Platform
    public var platform: String
    public var created: Date?
    public var modified: Date?
    public var info: String?
    
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
    }


    public init(id: DbCoreIdentifier? = nil, teamId: DbCoreIdentifier?, name: String, identifier: String, version: String, build: String, platform: Platform, info: String? = nil) {
        self.id = id
        self.teamId = teamId
        self.name = name
        self.identifier = identifier
        self.version = version
        self.build = build
        self.platform = platform.rawValue
        self.created = Date()
        self.modified = Date()
        self.info = info
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
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(App.self, on: connection)
    }
    
}
