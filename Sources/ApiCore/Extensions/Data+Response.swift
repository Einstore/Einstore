//
//  Data+Response.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 15/03/2018.
//

import Foundation
import Vapor


extension Data {
    
    public func asResponse(_ status: HTTPStatus, contentType: String = "application/json; charset=utf-8", to req: Request) throws -> Future<Response> {
        let response = try req.response.basic(status: status)
        response.http.headers.append(HTTPHeaders.Literal(dictionaryLiteral: (.contentType, contentType)))
        response.http.body = HTTPBody(self)
        return Future(response)
    }
    
}
