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
        try! T.query(on: req).delete().await(on: req)
    }
    
}
