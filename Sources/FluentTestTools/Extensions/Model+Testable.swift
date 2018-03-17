//
//  Model+Testable.swift
//  FluentTestTools
//
//  Created by Ondrej Rafaj on 28/02/2018.
//

import Foundation
import Vapor
import Fluent
import VaporTestTools


extension TestableProperty where TestableType: Model {
    
    public static func delete<T: Model>(_ type: T.Type = T.self, allOn app: Application) where T.Database: QuerySupporting {
        let req: Request = app.testable.fakeRequest()
        try! T.query(on: req).delete().wait()
    }
    
    public func countAll<T: Model>(_ type: T.Type = T.self, allOn app: Application) -> Int where T.Database: QuerySupporting {
        let req: Request = app.testable.fakeRequest()
        return try! T.query(on: req).count().wait()
    }
    
    public func one<T: Model>(_ type: T.Type = T.self, id: T.ID, on app: Application) -> T? where T.Database: QuerySupporting {
        let req: Request = app.testable.fakeRequest()
        return try! T.query(on: req).filter(\T.fluentID == id).first().wait()
    }
    
    public func all<T: Model>(_ type: T.Type = T.self, on app: Application) -> [T] where T.Database: QuerySupporting {
        let req: Request = app.testable.fakeRequest()
        return try! T.query(on: req).all().wait()
    }
    
}
