//
//  HistoryController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 26/11/2016.
//
//

import Vapor
import HTTP


enum HistoryEvent: String {
    case uploadedApp = "APU"
    case deletedApp = "APD"
}


final class HistoryController: ControllerProtocol {
    
    // MARK: Routing
    
    func configureRoutes(_ drop: Droplet) {
        let basic = drop.grouped("v1", "history")
        basic.get(handler: self.index)
        basic.get(Int.self) { request, appId in
            return try self.view(request: request, appId: appId)
        }
    }
    
    // MARK: Data pages
    
    func index(request: Request) throws -> ResponseRepresentable {
        return JSON([":)"])
    }
    
    func view(request: Request, appId: Int) throws -> ResponseRepresentable {
        return "You requested User #\(appId)"
    }
    
}
