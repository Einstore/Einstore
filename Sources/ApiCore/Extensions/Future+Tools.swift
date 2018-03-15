//
//  Future+Tools.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 14/02/2018.
//

import Foundation
import Vapor


extension Future {
    
//    public static func new(_ result: Expectation, on req: Request) -> Future<Expectation> {
//        return req.eventLoop.newSucceededFuture(result: result)
//    }
//
//    public static func void(on req: Request) -> Future<Void> {
//        return req.eventLoop.newSucceededFuture(result: Void())
//    }
    
    public func flatten() -> Future<Void> {
        return map(to: Void.self) { (_) -> Void in
            return Void()
        }
    }
    
}
