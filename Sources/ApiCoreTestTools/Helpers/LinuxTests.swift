//
//  LinuxTests.swift
//  ApiCoreTests
//
//  Created by Ondrej Rafaj on 01/03/2018.
//

import Foundation
import XCTest


public protocol LinuxTests {
    static var defaultTestSuite: XCTestSuite { get }
    static var allTests: [(String, Any)] { get }
    func testLinuxTests()
}


extension LinuxTests {
    
    public func doTestLinuxTestsAreOk() {
        #if os(macOS) || os(iOS) || os(tvOS) || os(watchOS)
        // Count number of methods
        let thisClass = type(of: self)
        let linuxCount = thisClass.allTests.count
        let darwinCount = Int(thisClass.defaultTestSuite.testCaseCount)
        XCTAssertEqual(linuxCount, darwinCount, "There is \(darwinCount - linuxCount) tests missing from allTests")
        
        // Look for duplicates
        let crossReferenceKeys = Dictionary(grouping: thisClass.allTests, by: { $0.0 })
        let duplicateKeys = crossReferenceKeys.filter { $1.count > 1 }.sorted { $0.1.count > $1.1.count }
        XCTAssertTrue(duplicateKeys.isEmpty, "You shouldn't have any duplicate keys in allTests")
        
//        let crossReferenceFuncs = Dictionary(grouping: thisClass.allTests, by: { ($0.1 as () -> ()) })
//        let duplicateFuncs = crossReferenceFuncs.filter { $1.count > 1 }.sorted { $0.1.count > $1.1.count }
//        XCTAssertTrue(duplicateFuncs.isEmpty, "You shouldn't have any duplicate function references in allTests")
        #endif
    }
    
}

