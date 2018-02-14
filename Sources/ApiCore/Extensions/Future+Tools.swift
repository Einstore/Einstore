//
//  Future+Tools.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 14/02/2018.
//

import Foundation
import Vapor


extension Future where T == Void {
    
    public static func make() -> Future<Void> {
        let promise = Promise<Void>()
        promise.complete()
        return promise.future
    }
    
}


extension Future where T: Content {
    
    public func void() -> Future<Void> {
        return map(to: Void.self, { (_) -> Void in
            return Void()
        })
    }
    
}


extension Array where Element == Future<Void> {
    
    public func join() -> Future<Void> {
        return map(to: Void.self, { (_) -> Void in
            return Void()
        })
    }
    
}
