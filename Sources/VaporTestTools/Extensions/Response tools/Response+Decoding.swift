//
//  Response+Decoding.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import Vapor


extension TestableProperty where TestableType: Response {
    
    public func content<T>(as type: T.Type) -> T? where T: Decodable {
        let object = try? element.content.decode(type).blockingAwait()
        return object
    }
    
}
