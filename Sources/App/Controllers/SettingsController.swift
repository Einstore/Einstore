//
//  SettingsController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 26/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import HTTP
import S3


enum SettingsKey: String {
    case storeName = "store-name"
    case storeSubtitle = "store-subtitle"
}


final class SettingsController: RootController, ControllerProtocol {
    
    
    let s3: S3
    
    
    // MARK: Initialization
    
    override init() {
        self.s3 = try! S3(droplet: drop)
    }
    
    // MARK: Routing
    
    func configureRoutes() {
        let group = self.baseRoute.grouped("settings")
        
        group.get(handler: self.index)
        group.post(handler: self.create)
        group.put(handler: self.update)
    }
    
    // MARK: Data pages
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        let output: [String: String] = try self.getSettings()
        
        return JSON(try output.makeNode())
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        let requestData: [String: Polymorphic] = self.dataFromRequest(request: request)
        try self.saveDataToS3(requestData)
        return JSON(try self.makeNode(polymorphicData: requestData))
    }
    
    func update(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        var output: [String: Polymorphic] = try self.getSettings()
        let requestData: [String: Polymorphic] = self.dataFromRequest(request: request)
        for key: String in requestData.keys {
            let value: Polymorphic = requestData[key]!
            output[key] = value
        }
        
        try self.saveDataToS3(output)
        return JSON(try self.makeNode(polymorphicData: output))
    }
    
}

// MARK: - Helper methods

extension SettingsController {
    
    func makeNode(polymorphicData: [String: Polymorphic]) throws -> Node {
        typealias T = String
        var newData: [String: T] = [:]
        for key: String in polymorphicData.keys {
            if let value: String = polymorphicData[key]!.string {
                newData[key] = value
            }
            else if let value: Int = polymorphicData[key]!.int {
                newData[key] = try value
            }
        }
        return try newData.makeNode()
    }
    
    func saveDataToS3(_ dataToSave: [String: Polymorphic]) throws {
        let dic: NSDictionary = NSDictionary(dictionary: dataToSave)
        let data: Data = NSKeyedArchiver.archivedData(withRootObject: dic)
        try self.s3.put(data: data, filePath: "settings/settings.plist")
    }
    
    func dataFromRequest(request: Request) -> [String: Polymorphic] {
        guard let dictionary = request.json?.object else {
            return [:]
        }
        return dictionary
    }
    
    func getSettings() throws -> [String: String] {
        let data: Data
        do {
            data = try self.s3.get(fileAtPath: "settings/settings.plist")
        }
        catch {
            return [:]
        }
        let settings: NSDictionary = NSKeyedUnarchiver.unarchiveObject(with: data) as! NSDictionary
        var output: [String: String] = [:]
        for key: String in settings.allKeys as! [String] {
            let value: String = settings[key] as! String
            output[key] = value
        }
        return output
    }
}
