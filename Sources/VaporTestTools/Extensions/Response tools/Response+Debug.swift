//
//  Response+Debug.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
@testable import Vapor


extension TestableProperty where TestableType: Response {
    
    public func debug() {
        print("Debugging response:")
        print("HTTP [\(element.http.version.major).\(element.http.version.minor)] with status code [\(element.http.status.code)]")
        print("Headers:")
        for header in element.http.headers {
            print("\t\(header.name.description) = \(header.value)")
        }
        print("Content:")
        if let size = element.content.body.count {
            print("\tSize: \(String(size))")
        }
        if let mediaType = element.content.mediaType {
            print("\tMedia type: \(mediaType.description)")
        }
        if let stringContent = element.testable.contentString {
            print("\tContent:\n\(stringContent)")
        }
    }
    
}
