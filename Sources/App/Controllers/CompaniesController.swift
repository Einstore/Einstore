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
import Routing


final class CompaniesController: RootController, ControllerProtocol {
    
    
    // MARK: Routing
    
    func configureRoutes() {
        let group: Routing.RouteGroup = self.baseRoute.grouped("companies")
        
        // Companies
        group.get(handler: self.index)
        group.post(handler: self.create)
        group.get(IdType.self) { request, objectId in
            return try self.get(request: request, objectId: objectId)
        }
        group.put(IdType.self) { request, objectId in
            return try self.update(request: request, objectId: objectId)
        }
        group.delete(IdType.self) { request, objectId in
            return try self.delete(request: request, objectId: objectId)
        }
        
        // Logo
        group.post(IdType.self, "logo") { request, objectId in
            return try self.logoUpload(request: request, objectId: objectId)
        }
        group.delete(IdType.self, "logo") { request, objectId in
            return try self.logoDelete(request: request, objectId: objectId)
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
            return JSON(try data.requestSorted(request, sortBy: "name", direction: .ascending).makeNode())
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
    
    func logoUpload(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        guard var object = try Company.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        do {
            guard let bytes: Bytes = request.body.bytes, bytes.count > 0 else {
                return ResponseBuilder.incompleteData
            }
            guard var mime: String = request.headers["Content-Type"] else {
                return ResponseBuilder.customErrorResponse(statusCode: .preconditionNotMet, message: Lang.get("Missing Content-Type header"))
            }
            mime = mime.lowercased()
            guard mime == "image/png" || mime == "image/jpeg" else {
                return ResponseBuilder.customErrorResponse(statusCode: .preconditionNotMet, message: Lang.get("File not supported"))
            }
            let fileName: String = "logo." + (Mime.fileExtension(forMime: mime) ?? "img")
            let companyPath: String = "companies/" + object.id!.string! + "/"
            let logoPath: String = companyPath + fileName
            
            let s3: S3 = try S3(droplet: drop)
            if object.logoName != nil {
                try s3.delete(fileAtPath: companyPath + object.logoName!)
            }
            try s3.put(bytes: bytes, filePath: logoPath)
            
            object.logoName = fileName
            try object.save()
            
            return ResponseBuilder.build(node: try ["uploaded": logoPath].makeNode(), statusCode: .success)
        }
        catch {
            return ResponseBuilder.internalServerError
        }
    }
    
    func logoDelete(request: Request, objectId: IdType) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        guard var object = try Company.find(objectId) else {
            return ResponseBuilder.notFound
        }
        
        do {
            if object.logoName != nil {
                let s3: S3 = try S3(droplet: drop)
                let logoPath: String = "companies/" + object.id!.string! + "/" + object.logoName!
                try s3.delete(fileAtPath: logoPath)
                
                object.logoName = nil
                
                try object.save()
            }
            return ResponseBuilder.customErrorResponse(statusCode: .successNoData, message: Lang.get("Deleted"))
        }
        catch {
            return ResponseBuilder.internalServerError
        }
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
            
            return ResponseBuilder.build(model: object, statusCode: code)
        }
        else {
            return ResponseBuilder.validationErrorResponse(errors: validated)
        }
    }
    
}
