//
//  Filesystem.swift
//  FileCore
//
//  Created by Ondrej Rafaj on 20/02/2018.
//

import Foundation
import Vapor
import ErrorsCore


public class Filesystem: Handler {
    
    public enum FilesystemError: FrontendError {
        case homeDirDoesnExistAndCannotBeCreated
        case fileCorrupted
        case fileMissing
        case unableToCreatePath
        case unableToWriteFile
        case unableToDeleteFile
        
        public var code: String {
            return "filesystem"
        }
        
        public var description: String {
            switch self {
            case .homeDirDoesnExistAndCannotBeCreated:
                return "Default file storage directory does not exist and can not be created"
            case .fileCorrupted:
                return "File seems to be corrupted"
            case .fileMissing:
                return "File not found"
            case .unableToCreatePath:
                return "Unable to create folder path"
            case .unableToWriteFile:
                return "Unable to write to file"
            case .unableToDeleteFile:
                return "Unable to delete to file"
            }
        }
        
        public var status: HTTPStatus {
            return .internalServerError
        }
        
    }
    
    public struct Config {
        
        public static var envRootDir: String? {
            let env = ProcessInfo.processInfo.environment as [String: String]
            return env["LOCAL_ROOT"] ?? env["HOME"]
        }
        
        let homeDir: URL
        
        public init(homeDir: String? = Config.envRootDir) throws {
            guard let homeDir = homeDir else {
                fatalError("Home directory hasn't been set and can not be found in environmental variables")
            }
            let url = URL(fileURLWithPath: homeDir).appendingPathComponent("Files")
            if !FileManager.default.fileExists(atPath: url.path) {
                do {
                    try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
                } catch {
                    throw FilesystemError.homeDirDoesnExistAndCannotBeCreated
                }
            }
            self.homeDir = url
        }
        
    }
    
    public let config: Config
    
    // MARK: Initialization
    
    public init(config: Config) {
        self.config = config
    }
    
    // MARK: File handling
    
    public func info(file: String) throws -> Future<[String : String]?> {
        let promise = Promise<[String : String]?>()
        // TODO: Make async
        if FileManager.default.fileExists(atPath: file) {
            do {
                let infoData = try FileManager.default.attributesOfItem(atPath: file)
                // TODO: Do something better with mapping
                var info: [String: String] = [:]
                for key in infoData.keys {
                    let value = infoData[key]
                    var stringValue: String? = nil
                    
                    // TODO: Check what can be in the dictionary exactly
                    if let v = value as? String {
                        stringValue = v
                    } else if let v = value as? Int {
                        stringValue = String(v)
                    } else if let v = value as? Bool {
                        stringValue = String(v)
                    }
                
                    guard let sv = stringValue else {
                        continue
                    }
                    info[key.rawValue] = sv
                }
                promise.complete(info)
            } catch {
                throw FilesystemError.fileCorrupted
            }
        }
        else {
            throw FilesystemError.fileMissing
        }
        return promise.future
    }
    
    public func exists(file: String) throws -> Future<Bool> {
        let promise = Promise<Bool>()
        // TODO: Make async
        promise.complete(FileManager.default.fileExists(atPath: file))
        return promise.future
    }
    
    public func upload(file: String, destination: String) throws -> Future<Void> {
        // TODO: Make async
        if FileManager.default.fileExists(atPath: file) {
            do {
                let data = try Data(contentsOf: URL(fileURLWithPath: file))
                return try upload(file: data, destination: destination)
            } catch {
                throw FilesystemError.fileCorrupted
            }
        }
        else {
            throw FilesystemError.fileMissing
        }
    }
    
    public func upload(file: Data, destination: String) throws -> Future<Void> {
        let promise = Promise<Void>()
        let url = config.homeDir.appendingPathComponent(destination)
        let path = url.deletingLastPathComponent()
        // TODO: Make async
        if !FileManager.default.fileExists(atPath: path.path) {
            do {
                try FileManager.default.createDirectory(at: path, withIntermediateDirectories: true)
            } catch {
                throw FilesystemError.unableToCreatePath
            }
        }
        try file.write(to: url)
        promise.complete()
        return promise.future
    }
    
    public func get(file: String) throws -> Future<Data> {
        let promise = Promise<Data>()
        // TODO: Make async
        if FileManager.default.fileExists(atPath: file) {
            do {
                let data = try Data(contentsOf: config.homeDir.appendingPathComponent(file))
                promise.complete(data)
            } catch {
                throw FilesystemError.fileCorrupted
            }
        }
        else {
            throw FilesystemError.fileMissing
        }
        return promise.future
    }
    
    public func delete(file: String) throws -> Future<Void> {
        let promise = Promise<Void>()
        let path = config.homeDir.appendingPathComponent(file)
        // TODO: Make async
        if FileManager.default.fileExists(atPath: path.path) {
            do {
                try FileManager.default.removeItem(at: path)
                promise.complete()
            } catch {
                throw FilesystemError.unableToDeleteFile
            }
        }
        else {
            promise.fail(FilesystemError.fileMissing)
        }
        return promise.future
    }
    
    public func download(file: String, destination: String) throws -> Future<Void> {
        // TODO: Implement yo!
        fatalError("Not implemented")
//        let promise = Promise<Void>()
//        return promise.future
    }
    
    
}
