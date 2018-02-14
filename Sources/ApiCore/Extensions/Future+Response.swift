//
//  Future+Response.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 13/02/2018.
//

import Foundation
import Vapor


extension Future where T: ResponseEncodable {
    
    public func asResponse(_ status: HTTPStatus, to req: Request) throws -> Future<Response> {
        return self.flatMap(to: Response.self) { try $0.encode(for: req) }.map(to: Response.self) {
            $0.http.status = status
            $0.http.headers.append(HTTPHeaders.Literal(dictionaryLiteral: (.contentType, "application/json; charset=utf-8")))
            return $0
        }
    }
    
}

extension Future where T == Void {
    
    public func asResponse(to req: Request) throws -> Future<Response> {
        return self.map(to: Response.self) { _ in
            return try req.response.noContent()
        }
    }
    
}

