//
//  BoostError.swift
//  Boost
//
//  Created by Ondrej Rafaj on 05/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation


enum BoostErrorReason: ErrorReason {
    
    case unarchivingFailed
    case missingManifestFile
    case corruptedManifestFile
    case invalidAppContent
    case missingPlatform
    case missingId
    case missingIdentifier
    case fileNotCompatible
    
}

class BoostError: SmokeError {
    
}
