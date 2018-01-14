//
//  String+CryptoTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 14/01/2018.
//

import Foundation
import App
import Dispatch
import XCTest
import Crypto


final class StringCryptoTests : XCTestCase {
    
    func testPasswordHash() throws {
        XCTAssert("password".passwordHash == "")
    }
    
    static let allTests = [
        ("testPasswordHashWorks", testPasswordHash),
        ]
    
}
