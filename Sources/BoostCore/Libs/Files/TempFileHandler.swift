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
    
    @discardableResult func delete(path: String) throws -> Future<Void>
    @discardableResult func delete(url: URL) throws -> Future<Void>
    
    @discardableResult func save(data: Data, to: String) throws -> Future<Void>
    func save(data: Data, to: URL) throws -> Future<Void>
    
    func move(from: String, to: String) throws -> Future<Void>
    func move(from: URL, to: URL) throws -> Future<Void>
}


public class LocalFileHandler: FileHandler {
    
    public static var `default`: FileHandler = LocalFileHandler()
    
    public func createFolderStructure(path: String) throws {
        try FileManager.default.createDirectory(atPath: path, withIntermediateDirectories: true)
    }
    
    public func createFolderStructure(url: URL) throws {
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
    }
    
    public func save(data: Data, to path: String) throws -> Future<Void> {
        try data.write(to: URL(fileURLWithPath: path))
        return Future(Void())
    }
    
    public func save(data: Data, to path: URL) throws -> Future<Void> {
        try data.write(to: path)
        return Future(Void())
    }
    
    public func move(from: String, to: String) throws -> Future<Void> {
        try FileManager.default.moveItem(atPath: from, toPath: to)
        return Future(Void())
    }
    
    public func move(from: URL, to: URL) throws -> Future<Void> {
        try FileManager.default.moveItem(at: from, to: to)
        return Future(Void())
    }
    
    public func delete(path: String) throws -> Future<Void> {
        try FileManager.default.removeItem(atPath: path)
        return Future(Void())
    }
    
    public func delete(url: URL) throws -> Future<Void> {
        try FileManager.default.removeItem(at: url)
        return Future(Void())
    }
    
}
