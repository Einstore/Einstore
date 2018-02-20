//
//  AppTag.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 13/02/2018.
//

import Foundation
import Fluent
import DbCore
import Vapor


public final class AppTag: ModifiablePivot, DbCoreModel {
    
    public typealias Left = App
    public typealias Right = Tag
    
    public typealias ID = DbCoreIdentifier
    
    public static var leftIDKey: WritableKeyPath<AppTag, DbCoreIdentifier> {
        return \.appId
    }
    
    public static var rightIDKey: WritableKeyPath<AppTag, DbCoreIdentifier> {
        return \.tagId
    }
    
    public static var idKey: WritableKeyPath<AppTag, DbCoreIdentifier?> {
        return \.id
    }
    
    public var id: ID?
    public var appId: ID
    public var tagId: ID
    
    // MARK: Initialization
    
    public init(_ left: AppTag.Left, _ right: AppTag.Right) throws {
        appId = try left.requireID()
        tagId = try right.requireID()
    }
    

}

// MARK: - Migrations

extension AppTag: Migration {
    
    public static func prepare(on connection: DbCoreConnection) -> Future<Void> {
        return Database.create(self, on: connection) { (schema) in
            try schema.field(for: \AppTag.id)
            try schema.field(for: \AppTag.appId)
            try schema.field(for: \AppTag.tagId)
        }
    }
    
    public static func revert(on connection: DbCoreConnection) -> Future<Void> {
        return Database.delete(AppTag.self, on: connection)
    }
}
