//
//  FluentDesign.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 05/03/2018.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL
import DbCore
import ErrorsCore


public typealias FluentDesigns = [FluentDesign]


public final class FluentDesign: DbCoreModel {
    
    public static let entity: String = "fluent"
    
    public var id: DbCoreIdentifier?
    public var name: String
    public var batch: Int
    public var createdAt: Date
    public var updatedAt: Date
    
    public init(id: DbCoreIdentifier? = nil, name: String, batch: Int, createdAt: Date = Date(), updatedAt: Date = Date()) {
        self.id = id
        self.name = name
        self.batch = batch
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
}

// MARK: - Migrations

extension FluentDesign: Migration {
    
    public static var idKey: WritableKeyPath<FluentDesign, DbCoreIdentifier?> = \FluentDesign.id
    
}

// MARK: - Queries

extension FluentDesign { }
