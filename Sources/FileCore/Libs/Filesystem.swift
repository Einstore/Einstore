//
//  Filesystem.swift
//  FileCore
//
//  Created by Ondrej Rafaj on 20/02/2018.
//

import Foundation
import Vapor


public class Filesystem: Handler {
    
    public func info(file: String) throws -> Future<[String : String]?> {
        let promise = Promise<[String : String]?>()
        
        return promise.future
    }
    
    public func upload(file: String, destination: String) throws -> Future<Void> {
        let promise = Promise<Void>()
        
        return promise.future
    }
    
    public func get(file: String) throws -> Future<Data> {
        let promise = Promise<Data>()
        
        return promise.future
    }
    
    public func download(file: String, destination: String) throws -> Future<Void> {
        let promise = Promise<Void>()
        
        return promise.future
    }
    
    
}
