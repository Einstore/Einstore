//
//  Gravatar.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 09/03/2018.
//

import Foundation


public class Gravatar {
    
    enum GravatarError: Error {
        case unableToCreateMD5FromEmail
    }
    
    public static func link(fromEmail email: String, size: CGFloat? = nil) throws -> String {
        guard let md5 = email.md5 else {
            throw GravatarError.unableToCreateMD5FromEmail
        }
        var url = "https://www.gravatar.com/avatar/\(md5)"
        if let size = size {
            url.append("?size=\(size)")
        }
        return url
    }
    
}
