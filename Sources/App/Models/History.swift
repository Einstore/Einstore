//
//  History.swift
//  Boost
//
//  Created by Ondrej Rafaj on 19/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import Fluent


enum HistoryEvent: Int {
    case unknown = 0
    case install = 10
    case uploadApp = 20
    case updateApp = 30
    case deleteApp = 40
    case deleteBuild = 50
}


final class History: Model {
    
    static var entity = "history"
    
    var exists: Bool = false
    
    var id: Node?
    var event: HistoryEvent?
    var created: Date?
    var message: String?
    var authorId: IdType?
    var objectId: IdType?
    
    
    // MARK: Initialization
    
    init() {
        
    }
    
    static func make(_ eventType: HistoryEvent, objectId: Node? = nil, authorId: Node? = nil, message: String? = nil) throws {
        var author: Node? = authorId
        if authorId == nil {
            author = Me.shared.id()
        }
        var object: History = History()
        object.event = eventType
        object.created = Date()
        object.message = message
        object.authorId = author?.string
        object.objectId = objectId?.string
        try object.save()
    }
    
    static func make(_ eventType: HistoryEvent, objectId: Node, message: String) throws {
        try self.make(eventType, objectId: objectId, authorId: nil, message: message)
    }
    
    static func make(_ eventType: HistoryEvent, message: String) throws {
        try self.make(eventType, objectId: nil, authorId: nil, message: message)
    }
    
    init(node: Node, in context: Context) throws {
        self.id = try node.extract("_id")
        self.event = HistoryEvent(rawValue: try node.extract("event"))
        self.created = try Date(rfc1123: node.extract("created"))
        self.message = try node.extract("message")
        self.authorId = try node.extract("author")
        self.objectId = try node.extract("object")
    }
    
    func makeNode(context: Context) throws -> Node {
        return try Node(node: [
            "_id": self.id,
            "event": self.event?.rawValue ??  0,
            "created": self.created?.rfc1123,
            "message": self.message,
            "author": self.authorId,
            "object": self.objectId
            ])
    }
    
}

extension History: Preparation {
    
    static func prepare(_ database: Database) throws {
        
    }
    
    static func revert(_ database: Database) throws {
        try database.delete("history")
    }
    
}


// MARK: - Helpers

extension History {
    
    // MARK: Get
    
    
    
    // MARK: Delete
    
    
    
}


