//
//  CompaniesController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor
import HTTP
import S3
import MimeLib


final class CompaniesController: RootController, ControllerProtocol {
    
    
    // MARK: Routing
    
    func configureRoutes() {
        self.baseRoute.get("companies", handler: self.index)
        self.baseRoute.post("companies", handler: self.create)
        self.baseRoute.get("companies", IdType.self) { request, objectId in
            return try self.get(request: request, objectId: objectId)
        }
        self.baseRoute.put("companies", IdType.self) { request, objectId in
            return try self.update(request: request, objectId: objectId)
        }
        self.baseRoute.delete("companies", IdType.self) { request, objectId in
            return try self.delete(request: request, objectId: objectId)
        }
    }
    
    // MARK: Companies
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        // BOOST: Show only user companies if he's not an admin
        guard Me.shared.type(min: .admin) else {
            let data = try Company.query()
            return JSON(try data.all().makeNode())
        }
        
        let data = try Company.query()
        return JSON(try data.all().makeNode())
    }
    
    func get(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.kickOut(request) {
            return response
        }
        
        // BOOST: Show only user company if he's not an admin
        if !Me.shared.type(min: .admin) {
            guard let object = try Company.find(objectId) else {
                return ResponseBuilder.notFound
            }
            return ResponseBuilder.build(model: object)
        }
        
        guard let object = try Company.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        return ResponseBuilder.build(model: object)
    }
    
    func update(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        guard var object = try Company.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        return self.checkAndSave(object: &object, withResponse: request, andStatusCode: .success)
    }
    
    func create(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        var object = Company()
        object.created = Date()
        
        return self.checkAndSave(object: &object, withResponse: request, andStatusCode: .created)
    }
    
    func delete(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        guard let object = try Company.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        do {
            try object.delete()
        }
        catch {
            return ResponseBuilder.actionFailed
        }
        
        return ResponseBuilder.okNoContent
    }
    
}

// MARK: - Helper methods

extension CompaniesController {
    
    
    // MARK: Saving with response
    
    func checkAndSave(object: inout Company, withResponse request: Request, andStatusCode code: StatusCodes) -> ResponseRepresentable {
        let validated: [ValidationError] = request.isCool(forValues: Company.validationFields)
        if validated.count == 0 {
            do {
                try object.update(fromRequest: request)
            }
            catch {
                return ResponseBuilder.incompleteData
            }
            do {
                try object.save()
            }
            catch {
                return ResponseBuilder.internalServerError
            }
            
            do {
                let s3: S3 = try S3(droplet: drop)
                if let removeLogo: Bool = request.data["remove-logo"]?.bool {
                    if removeLogo == true && object.logoName != nil {
                        let logoPath: String = "companies/" + object.id!.string! + "/" + object.logoName!
                        try s3.delete(fileAtPath: logoPath)
                    }
                }
                if let file: Multipart.File = request.multipart?["logo"]?.file {
                    let logoPath: String = "companies/" + object.id!.string! + "/logo." + Mime.fileExtension(forMime: file.type!)!
                    try s3.put(bytes: file.data, filePath: logoPath)
                    
                }
            }
            catch {
                
            }
            return ResponseBuilder.build(model: object, statusCode: code)
        }
        else {
            return ResponseBuilder.validationErrorResponse(errors: validated)
        }
    }
    
}
