//
//  Team+UploadKeys.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 05/03/2018.
//

import Foundation
import ApiCore
import Fluent


// MARK: - Relations

extension Team {
    
    public var uploadKeys: Children<Team, UploadKey> {
        return children(\.teamId)
    }
    
}

