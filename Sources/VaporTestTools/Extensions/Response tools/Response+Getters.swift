//
//  Response+Getters.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
@testable import Vapor


extension TestableProperty where TestableType: Response {
    
    public func header(name: String) -> String? {
        let headerName = HTTPHeaderName(name)
        return header(name: headerName)
    }
    
    public func header(name: HTTPHeaderName) -> String? {
        return element.http.headers[name]
    }
    
    public var contentSize: Int? {
        return element.content.body.count
    }
    
    public var contentString: String? {
        guard let data = try? element.content.body.makeData(max: 500000).blockingAwait() else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }
    
    public func contentString(encoding: String.Encoding) -> String? {
        guard let data = try? element.content.body.makeData(max: 500000).blockingAwait() else {
            return nil
        }
        return String(data: data, encoding: encoding)
    }
    
}
