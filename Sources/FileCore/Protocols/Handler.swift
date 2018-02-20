//
//  Handler.swift
//  FileCore
//
//  Created by Ondrej Rafaj on 20/02/2018.
//

import Foundation
import Vapor


public protocol Handler {
    
    func info(file: String) throws -> Future<[String: String]?>
    func exists(file: String) throws -> Future<Bool>
    func upload(file: String, destination: String) throws -> Future<Void>
    func upload(file: Data, destination: String) throws -> Future<Void>
    func get(file: String) throws -> Future<Data>
    func delete(file: String) throws -> Future<Void>
    func download(file: String, destination: String) throws -> Future<Void>
    
}
