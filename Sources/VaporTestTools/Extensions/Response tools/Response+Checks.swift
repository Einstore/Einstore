//
//  Response+Checks.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import Vapor


extension TestableProperty where TestableType: Response {
    
    public func has(header name: HTTPHeaderName, content: String? = nil) -> Bool {
        guard let header = element.http.headers[name] else {
            return false
        }
        
        if let content = content {
            return header.contains(content)
        }
        
        return true
    }
    
    public func has(header name: String, content: String? = nil) -> Bool {
        let headerName = HTTPHeaderName(name)
        return has(header: headerName, content: content)
    }
    
}
