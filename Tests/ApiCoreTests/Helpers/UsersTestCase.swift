//
//  UsersTestCase.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 28/02/2018.
//

import Foundation
import XCTest
import Vapor
import VaporTestTools
import ApiCore


protocol UsersTestCase: class {
    var app: Application! { get }
    var user1: User! { get set }
    var user2: User! { get set }
}


extension UsersTestCase {
    
    func setupUsers() {
        app.testable.delete(allFor: User.self)
        
        user1 = User.testable.createSu(on: app)
        user2 = User.testable.create(on: app)
    }
    
}
