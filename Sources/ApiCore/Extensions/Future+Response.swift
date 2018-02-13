//
//  Future+Response.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 13/02/2018.
//

import Foundation
import Vapor
import HTTP
import Fluent


extension Future where T: ResponseEncodable {
    
    public func asResponse(_ status: HTTPStatus, to req: Request) throws -> Future<Response> {
        return self.flatMap(to: Response.self) { try $0.encode(for: req) }.map(to: Response.self) {
            $0.http.status = status
            $0.http.headers.append(HTTPHeaders.Literal(dictionaryLiteral: (.contentType, "application/json; charset=utf-8")))
            return $0
        }
    }
    
}


extension Content {
    
    public func asResponse(_ status: HTTPStatus, to req: Request) throws -> Future<Response> {
        return try encode(for: req).map(to: Response.self) {
            $0.http.status = status
            $0.http.headers.append(HTTPHeaders.Literal(dictionaryLiteral: (.contentType, "application/json; charset=utf-8")))
            return $0
        }
    }
    
}

