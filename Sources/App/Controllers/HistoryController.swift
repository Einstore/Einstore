//
//  HistoryController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 26/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP


final class HistoryController: RootController, ControllerProtocol {
    
    
    // MARK: Routing
    
    func configureRoutes() {
        let basic = self.baseRoute.grouped("history")
        basic.get(handler: self.index)
    }
    
    // MARK: Data pages
    
    func index(request: Request) throws -> ResponseRepresentable {
        if let response = super.basicAuth(request) {
            return response
        }
        
        let data: [History] = try History.query().requestSorted(request, sortBy: "created", direction: .descending)
        return JSON(try data.makeNode())
    }
    
}
