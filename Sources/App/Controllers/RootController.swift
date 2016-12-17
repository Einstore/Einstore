//
//  RootController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 28/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP
import Routing


class RootController {
    
    
    // MARK: Routing
    
    var baseRoute: Routing.RouteGroup = drop.grouped("v1")
    
    // MARK: Authentication
    
    func basicAuth(_ request: Request, minAccess userType: UserType = .admin) -> ResponseRepresentable? {
        if let response = self.kickOut(request) {
            return response
        }
        
        guard Me.shared.type(min: userType) else {
            return ResponseBuilder.notAuthorised
        }
        
        return nil
    }
    
    func kickOut(_ request: Request) -> ResponseRepresentable? {
        if let token = request.authTokenString {
            do {
                // BOOST: It would be good to cache variable amount of auth codes and users to avoid querying database too often!
                // BOOST: Can we merge the following into one query?
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
