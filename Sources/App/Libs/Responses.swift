//
//  Responses.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import HTTP


struct Responses {
    
    static var okNoContent: ResponseRepresentable {
        get {
            return Response(status: .other(statusCode: 204, reasonPhrase: "Success"))
        }
    }
    
    static var invalidAuthentication: ResponseRepresentable {
        get {
            return Response(status: .other(statusCode: 403, reasonPhrase: "Invalid authentication"))
        }
    }
    
    static var notFound: ResponseRepresentable {
        get {
            return Response(status: .other(statusCode: 404, reasonPhrase: "Not found"))
        }
    }
    
    static var notAuthorised: ResponseRepresentable {
        get {
            return Response(status: .other(statusCode: 403, reasonPhrase: "Not authorised"))
        }
    }
    
}
