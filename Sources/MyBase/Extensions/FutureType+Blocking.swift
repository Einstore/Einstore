//
//  FutureType+Blocking.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 10/12/2017.
//

import Foundation
import Vapor

extension Future {
    
    public func systemBlockingAwait() throws -> Expectation {
        return try blockingAwait(timeout: .seconds(2))
    }
    
}
