//
//  GenericControllerTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import XCTest
import Vapor
import VaporTestTools
import ApiCoreTestTools


class GenericControllerTests: XCTestCase {
    
    var app: Application!
    
    // MARK: Setup
    
    override func setUp() {
        super.setUp()
        
        app = try! Application.testable.newApiCoreTestApp()
    }
    
    // MARK: Tests
    
    func testPing() {
        
    }
    
    func testPong() {
        
    }
    
}
