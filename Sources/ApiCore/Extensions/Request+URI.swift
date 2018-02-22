//
//  Request+URI.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 22/02/2018.
//

import Foundation
import Vapor


extension Request {
    
    public func serverURL() -> URL? {
        if http.headers["X-Forwarded-Proto"] == "https" {
            let uri = URI(scheme: "https", userInfo: http.uri.userInfo, hostname: http.uri.hostname, port: nil, path: http.uri.path, query: http.uri.query, fragment: http.uri.fragment)
            return URL(string: uri.path)
        }
        
        return URL(string: http.uri.path)
    }
    
    public func serverBaseUrl() -> URL? {
        guard let url = serverURL() else {
            return nil
        }
        return url.deletingPathExtension()
    }
    
}
