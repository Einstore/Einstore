//
//  String+Manipulation.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 18/01/2018.
//

import Foundation
import Gravatar


extension String {
    
    public var safeText: String {
        var text = components(separatedBy: CharacterSet.alphanumerics.inverted).joined(separator: "-").lowercased()
        text = text.components(separatedBy: CharacterSet(charactersIn: "-")).filter { !$0.isEmpty }.joined(separator: "-")
        return text
    }
    
    public var maskedName: String {
        var text = components(separatedBy: CharacterSet.alphanumerics.inverted).joined(separator: "-").lowercased()
        text = text.components(separatedBy: CharacterSet(charactersIn: "-")).filter { !$0.isEmpty }.joined(separator: "-")
        return text
    }
    
    public var imageUrlFromMail: String {
        let text = try? Gravatar.link(fromEmail: self)
        return text ?? "https://www.gravatar.com/avatar/unknown"
    }
    
}
