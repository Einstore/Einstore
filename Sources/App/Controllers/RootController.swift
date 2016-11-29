//
//  RootController.swift
//  Boost
//
//  Created by Ondrej Rafaj on 28/11/2016.
//
//

import Vapor
import HTTP


class RootController {
    
    
    // MARK: Authentication
    
    func kickOut(_ request: Request) -> ResponseRepresentable? {
        if let token = request.tokenString {
            do {
                // TODO: Can we merge the following into one query?
                let hashedToken = try drop.hash.make(token)
                Me.shared.auth = try Auth.query().filter("token", hashedToken).first()
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
        return Responses.notFound
    }
    
}
