//
//  FutureType+Blocking.swift
//  MyBase
//
//  Created by Ondrej Rafaj on 10/12/2017.
//

import Foundation
import Vapor

extension FutureType {
    
    public func systemBlockingAwait() throws -> Self.Expectation {
        return try blockingAwait(timeout: .seconds(5))
    }
    
}
