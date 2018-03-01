//
//  String+CryptoTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 14/01/2018.
//

import Foundation
import Vapor
import ApiCore
import Dispatch
import XCTest
import Crypto
import VaporTestTools


final class StringCryptoTests : XCTestCase {
    
    var app: Application!
    
    // MARK: Linux
    
    static let allTests = [
        ("testPasswordHash", testPasswordHash)
    ]
    
    // MARK: Setup
    
    override func setUp() {
        super.setUp()
        
        app = Application.testable.newApiCoreTestApp()
    }
    
    // MARK: Tests
    
    func testPasswordHash() throws {
        let req = app.testable.fakeRequest()
        let hashed = try! "password".passwordHash(req)
        XCTAssert(hashed == "password")
    }
    
}
