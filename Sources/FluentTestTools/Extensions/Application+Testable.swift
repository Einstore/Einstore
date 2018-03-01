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
    
    public func count<T: Model>(allFor type: T.Type) -> Int where T.Database: QuerySupporting {
        let req: Request = element.testable.fakeRequest()
        return try! T.query(on: req).count().await(on: req)
    }
    
    public func one<T: Model>(for type: T.Type, id: T.ID) -> T? where T.Database: QuerySupporting {
        let req: Request = element.testable.fakeRequest()
        return try! T.query(on: req).filter(\T.fluentID == id).first().await(on: req)
    }
    
    public func all<T: Model>(for type: T.Type) -> [T] where T.Database: QuerySupporting {
        let req: Request = element.testable.fakeRequest()
        return try! T.query(on: req).all().await(on: req)
    }
    
}

