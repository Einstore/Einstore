//
//  FileHandler.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 08/03/2018.
//

import Foundation
import Vapor


public struct StorageFileConfig {
    public var mainFolderPath: String = "/Boost/storage"
}

public struct TempFileConfig {
    public var mainFolderPath: String = "/Boost/tmp"
}



public protocol FileHandler {
    
    static var `default`: FileHandler { get }
    
    func createFolderStructure(path: String) throws
    func createFolderStructure(url: URL) throws
    
    func delete(path: String, on: Request) throws -> Future<Void>
    func delete(url: URL, on: Request) throws -> Future<Void>
    
    func save(data: Data, to: String, on: Request) throws -> Future<Void>
    func save(data: Data, to: URL, on: Request) throws -> Future<Void>
    
    func move(from: String, to: String, on: Request) throws -> Future<Void>
    func move(from: URL, to: URL, on: Request) throws -> Future<Void>
    
    func copy(from: String, to: String, on: Request) throws -> Future<Void>
    func copy(from: URL, to: URL, on: Request) throws -> Future<Void>
}


public class LocalFileHandler: FileHandler {
    
    public static var `default`: FileHandler = LocalFileHandler()
    
    public func createFolderStructure(path: String) throws {
        try FileManager.default.createDirectory(atPath: path, withIntermediateDirectories: true)
    }
    
    public func createFolderStructure(url: URL) throws {
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
    }
    
    public func delete(path: String, on req: Request) throws -> Future<Void> {
        if FileManager.default.fileExists(atPath: path) {
            try FileManager.default.removeItem(atPath: path)
        }
        return req.eventLoop.newSucceededFuture(result: Void())
    }
    
    public func delete(url: URL, on req: Request) throws -> Future<Void> {
        if FileManager.default.fileExists(atPath: url.path) {
            try FileManager.default.removeItem(at: url)
        }
        return req.eventLoop.newSucceededFuture(result: Void())
    }
    
    public func save(data: Data, to path: String, on req: Request) throws -> Future<Void> {
        try data.write(to: URL(fileURLWithPath: path))
        return req.eventLoop.newSucceededFuture(result: Void())
    }
    
    public func save(data: Data, to path: URL, on req: Request) throws -> Future<Void> {
        try data.write(to: path)
        return req.eventLoop.newSucceededFuture(result: Void())
    }
    
    public func move(from: String, to: String, on req: Request) throws -> Future<Void> {
        try FileManager.default.moveItem(atPath: from, toPath: to)
        return req.eventLoop.newSucceededFuture(result: Void())
    }
    
    public func move(from: URL, to: URL, on req: Request) throws -> Future<Void> {
        try FileManager.default.moveItem(at: from, to: to)
        return req.eventLoop.newSucceededFuture(result: Void())
    }
    
    public func copy(from: String, to: String, on req: Request) throws -> Future<Void> {
        try FileManager.default.copyItem(atPath: from, toPath: to)
        return req.eventLoop.newSucceededFuture(result: Void())
    }
    
    public func copy(from: URL, to: URL, on req: Request) throws -> Future<Void> {
        try FileManager.default.copyItem(at: from, to: to)
        return req.eventLoop.newSucceededFuture(result: Void())
    }
    
}
