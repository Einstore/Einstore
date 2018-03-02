//
//  String+Crypto.swift
//  Gravatar
//
//  Created by Ondrej Rafaj on 02/03/2018.
//

import Foundation
import Crypto

extension String {
    
    var md5: String? {
        return MD5.hash(self).hexString
    }
    
}
