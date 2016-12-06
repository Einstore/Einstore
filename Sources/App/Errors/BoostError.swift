//
//  BoostError.swift
//  Boost
//
//  Created by Ondrej Rafaj on 05/12/2016.
//
//

import Foundation


enum ErrorReason {
    
    case noFile
    case noData
    case unarchivingFailed
    case cacheNotAccessible
    case missingManifestFile
    
    case generic(String)
    
}

class BoostError: Error {
    
    
    let type: ErrorReason
    let number: Int32
    
    
    // MARK: Initialization
    
    init(_ type: ErrorReason) {
        self.type = type
        self.number = errno
    }
    
    init(message: String) {
        self.type = .generic(message)
        self.number = -1
    }

    
}
