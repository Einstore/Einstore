//
//  RootController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 28/11/2016.
//
//

import Vapor
import HTTP
import Routing


class RootController {
    
    
    // MARK: Routing
    
    var baseRoute: Routing.RouteGroup = drop.grouped("v1")
    
    // MARK: Authentication
    
    func kickOut(_ request: Request) -> ResponseRepresentable? {
        
        if let token = request.tokenString {
            do {
                // TODO: Can we merge the following into one query?
                Me.shared.auth = try Auth.find(tokenString: token)
                if Me.shared.auth != nil {
                    Me.shared.user = try User.find(Me.shared.auth!.userId!)
                    if Me.shared.user != nil {
                        return nil
                    }
                }
            }
            catch {
                
            }
        }
        return ResponseBuilder.notAuthorised
    }
    
}
