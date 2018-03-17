//
//  Router+Extended.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 17/03/2018.
//

import Foundation
import Vapor

extension Router {
    
    @discardableResult public func options<T>(_ path: DynamicPathComponentRepresentable..., use closure: @escaping RouteResponder<T>.Closure) -> Route<Responder> where T: ResponseEncodable {
        return self.on(.OPTIONS, at: path.makeDynamicPathComponents(), use: closure)
    }
    
}
