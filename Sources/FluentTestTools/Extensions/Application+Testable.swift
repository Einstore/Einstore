//
//  Application+Testable.swift
//  FluentTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import Vapor
import Fluent
import VaporTestTools


extension TestableProperty where TestableType: Application {
    
    public func delete<T: Model>(allFor type: T.Type) where T.Database: QuerySupporting {
        let req: Request = element.testable.fakeRequest()
        try! T.query(on: req).delete().await(on: req)
    }
    
}

