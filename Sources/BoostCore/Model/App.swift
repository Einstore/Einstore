//
//  App.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import Fluent
import FluentMySQL
import DbCore


final class App: DbCoreModel {
    
    enum Platform: String, Codable, KeyStringDecodable {
        case unknown
        case iOS = "ios"
        case tvOS = "tvos"
        case url = "url"
        case simulator = "simulator"
        case android = "android"
        case macOS = "macos"
        case windows = "windows"
        
        static var keyStringTrue: App.Platform = .unknown
        static var keyStringFalse: App.Platform = .unknown
    }
    
    typealias Database = DbCoreDatabase
    typealias ID = DbCoreIdentifier
    
    static var idKey = \App.id
    
    var id: ID?
    var teamId: ID?
    var name: String
    var identifier: String
    var version: String
    var build: String
    //var platform: Platform
    var platform: String
    var created: Date?
    var modified: Date?
    var availableToAll: Bool
    
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
        case availableToAll = "basic"
    }


    init(id: ID? = nil, teamId: ID?, name: String, identifier: String, version: String, build: String, platform: Platform, availableToAll: Bool = false) {
        self.id = id
        self.teamId = teamId
        self.name = name
        self.identifier = identifier
        self.version = version
        self.build = build
        self.platform = platform.rawValue
        self.created = Date()
        self.modified = Date()
        self.availableToAll = availableToAll
    }
    
}

extension App: Migration {
    
    public static func prepare(on connection: Database.Connection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema: SchemaBuilder<App>) in
            schema.addField(type: ColumnType.uint32(length: 11), name: CodingKeys.id.stringValue, isIdentifier: true)
            schema.addField(type: ColumnType.uint32(length: 11), name: CodingKeys.teamId.stringValue)
            schema.addField(type: ColumnType.varChar(length: 140), name: CodingKeys.name.stringValue)
            schema.addField(type: ColumnType.varChar(length: 140), name: CodingKeys.identifier.stringValue)
            schema.addField(type: ColumnType.varChar(length: 20), name: CodingKeys.version.stringValue)
            schema.addField(type: ColumnType.varChar(length: 20), name: CodingKeys.build.stringValue)
            schema.addField(type: ColumnType.varChar(length: 10), name: CodingKeys.platform.stringValue)
            schema.addField(type: ColumnType.datetime(), name: CodingKeys.created.stringValue)
            schema.addField(type: ColumnType.datetime(), name: CodingKeys.modified.stringValue)
            schema.addField(type: ColumnType.uint8(length: 1), name: CodingKeys.availableToAll.stringValue)
        }
    }
    
}


