//
//  HTTPRequest+Response.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import Vapor

extension TestableProperty where TestableType == HTTPRequest {
    
    func response(using app: Application) -> Response {
        let responder = try! app.make(Responder.self)
        let wrappedRequest = Request(http: element, using: app)
        return try! responder.respond(to: wrappedRequest).blockingAwait()
    }
    
}
