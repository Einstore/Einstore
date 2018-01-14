//
//  Request+Tables.swift
//  DbCore
//
//  Created by Ondrej Rafaj on 14/01/2018.
//

import Foundation
import Vapor


extension Request {
    
    public var dbHelpers: Helpers {
        return Helpers(self)
    }
    
}
