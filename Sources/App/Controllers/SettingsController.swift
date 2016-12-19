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
        
        let output: [String: Any] = try self.getSettings()
        return JSON(try self.makeNode(data: output))
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        let requestData: [String: Any] = self.dataFromRequest(request: request)
        try self.saveDataToS3(requestData)
        return JSON(try self.makeNode(data: requestData))
    }
    
    func update(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        var output: [String: Any] = try self.getSettings()
        let requestData: [String: Any] = self.dataFromRequest(request: request)
        for key: String in requestData.keys {
            if let value: String = requestData[key] as? String {
                output[key] = value
            }
            else if let value: Int = requestData[key] as? Int {
                output[key] = value
            }
        }
        try self.saveDataToS3(output)
        return JSON(try self.makeNode(data: output))
    }
    
}

// MARK: - Helper methods

extension SettingsController {
    
    func makeNode(data: [String: Any]) throws -> Node {
        var newData: [String: Node] = [:]
        for key: String in data.keys {
            if let value: String = data[key] as? String {
                newData[key] = value.makeNode()
            }
            else if let value: Int = data[key] as? Int {
                newData[key] = try value.makeNode()
            }
        }
        return try newData.makeNode()
    }
    
    func saveDataToS3(_ dataToSave: [String: Any]) throws {
        let dic: NSDictionary = NSDictionary(dictionary: dataToSave)
        let data: Data = NSKeyedArchiver.archivedData(withRootObject: dic)
        try self.s3.put(data: data, filePath: "settings/settings.plist")
    }
    
    func dataFromRequest(request: Request) -> [String: Any] {
        guard let dictionary = request.json?.object else {
            return [:]
        }
        var newData: [String: Any] = [:]
        for key: String in dictionary.keys {
            if let value: String = dictionary[key]?.string {
                newData[key] = value
            }
            else if let value: Int = dictionary[key]?.int {
                newData[key] = value
            }
        }
        return newData
    }
    
    func getSettings() throws -> [String: Any] {
        let data: Data
        do {
            data = try self.s3.get(fileAtPath: "settings/settings.plist")
        }
        catch {
            return [:]
        }
        let settings: NSDictionary = NSKeyedUnarchiver.unarchiveObject(with: data) as! NSDictionary
        var output: [String: Any] = [:]
        for key: String in settings.allKeys as! [String] {
            if let value: String = settings[key] as? String {
                output[key] = value
            }
            else if let value: Int = settings[key] as? Int {
                output[key] = value
            }
        }
        return output
    }
}
