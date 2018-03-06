//
//  AppsControllerTests.swift
//  BoostCoreTests
//
//  Created by Ondrej Rafaj on 05/03/2018.
//

import Foundation
import XCTest
import Vapor
import VaporTestTools
import FluentTestTools
import ApiCoreTestTools
import BoostTestTools
@testable import ApiCore
@testable import BoostCore


class AppsControllerTests: XCTestCase, AppTestCaseSetup, LinuxTests {
    
    var app: Application!
    
    var user1: User!
    var user2: User!
    
    var team1: Team!
    var team2: Team!
    
    var key1: UploadKey!
    var key2: UploadKey!
    var key3: UploadKey!
    var key4: UploadKey!
    
    var team4: Team!
    
    var app1: App!
    var app2: App!
    
    
    // MARK: Linux
    
    static let allTests: [(String, Any)] = [
        ("testGetAppsOverview", testGetAppsOverview),
        ("testOldIosApp", testOldIosApp),
        ("testUnobfuscatedApkUploadWithJWTAuth", testUnobfuscatedApkUploadWithJWTAuth),
        ("testObfuscatedApkUploadWithJWTAuth", testObfuscatedApkUploadWithJWTAuth),
        ("testLinuxTests", testLinuxTests)
    ]
    
    func testLinuxTests() {
        doTestLinuxTestsAreOk()
    }
    
    // MARK: Setup
    
    override func setUp() {
        super.setUp()
        
        app = Application.testable.newBoostTestApp()
        
        app.testable.delete(allFor: Token.self)
        
        setupApps()
    }
    
    override func tearDown() {
        deleteAllFiles()
        
        super.tearDown()
    }
    
    // MARK: Tests
    
    func testGetAppsOverview() {
        let count = app.testable.count(allFor: App.self)
        XCTAssertEqual(count, 107, "There should be right amount of apps to begin with")
        
        let req = HTTPRequest.testable.get(uri: "/apps", authorizedUser: user1, on: app)
        let res = app.testable.response(to: req)
        
        res.testable.debug()
        
        let keys = res.testable.content(as: Apps.self)!
        
        XCTAssertEqual(keys.count, 100, "There should be right amount of apps")
        
        XCTAssertTrue(res.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(res.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
    }
    
    func testOldIosApp() {
        doTestJWTUpload(appFileName: "app.ipa", platform: .ios, name: "iDeviant", identifier: "com.fuerteint.iDeviant", version: "4.0", build: "1.0")
        // TODO: Test token upload
    }
    
    func testUnobfuscatedApkUploadWithJWTAuth() {
        // TODO: Make another app!!!!!!!!!
        doTestJWTUpload(appFileName: "app.apk", platform: .android, name: "Bytecheck", identifier: "cz.vhrdina.bytecheck.ByteCheckApplication", version: "7.1.1", build: "25")
        // TODO: Test token upload
    }
    
    func testObfuscatedApkUploadWithJWTAuth() {
        doTestJWTUpload(appFileName: "app-obfuscated.apk", platform: .android, name: "BoostTest", identifier: "io.liveui.boosttest")
    }
    
}


extension AppsControllerTests {
    
    private func doTestJWTUpload(appFileName fileName: String, platform: App.Platform, name: String, identifier: String, version: String? = nil, build: String? = nil, tags: [String] = ["tagging_like_crazy", "All Year Round"]) {
        let appUrl = Application.testable.paths.resourcesUrl.appendingPathComponent("Demo").appendingPathComponent(fileName)
        let postData = try! Data(contentsOf: appUrl)
        let encodedTags: String = tags.joined(separator: "|").addingPercentEncoding(withAllowedCharacters: .urlHostAllowed)!
        let req = try! HTTPRequest.testable.post(uri: "/teams/\(team1.id!.uuidString)/apps?tags=\(encodedTags)".makeURI(), data: postData, headers: [
            "Content-Type": (platform == .ios ? "application/octet-stream" : "application/vnd.android.package-archive")
            ], authorizedUser: user1, on: app
        )
        
        doTest(request: req, platform: platform, name: name, identifier: identifier, version: version, build: build, tags: tags)
    }
    
    private func doTestTokenUpload(appFileName fileName: String, platform: App.Platform, name: String, identifier: String, version: String? = nil, build: String? = nil, tags: [String] = ["tagging_like_crazy", "All Year Round"]) {
        let appUrl = Application.testable.paths.resourcesUrl.appendingPathComponent("Demo").appendingPathComponent(fileName)
        let postData = try! Data(contentsOf: appUrl)
        let encodedTags: String = tags.joined(separator: "|").addingPercentEncoding(withAllowedCharacters: .urlHostAllowed)!
        let req = try! HTTPRequest.testable.post(uri: "/apps?tags=\(encodedTags)&token=AAAAAAAAAA".makeURI(), data: postData, headers: [
            "Content-Type": (platform == .ios ? "application/octet-stream" : "application/vnd.android.package-archive")
            ], authorizedUser: user1, on: app
        )
        
        doTest(request: req, platform: platform, name: name, identifier: identifier, version: version, build: build, tags: tags)
    }
    
    private func doTest(request req: HTTPRequest, platform: App.Platform, name: String, identifier: String, version: String?, build: String?, tags: [String]) {
        var count = app.testable.count(allFor: App.self)
        XCTAssertEqual(count, 107, "There should be right amount of apps to begin with")
        
        let res = app.testable.response(to: req)
        
        res.testable.debug()
        
        let object = res.testable.content(as: App.self)!
        
        XCTAssertEqual(object.platform, platform.rawValue, "Wrong platform")
        XCTAssertEqual(object.name, name, "Wrong name")
        XCTAssertEqual(object.identifier, identifier, "Wrong identifier")
        XCTAssertEqual(object.version, version ?? "0.0", "Wrong version")
        XCTAssertEqual(object.build, build ?? "0", "Wrong build")
        
        // TODO: Test app file has been created and moved to the correct location!!!!!!!!!!
        // TODO: Test images are all ok!!!!!!!!!
        // TODO: Test all files have been deleted!!!!!
        
        let fakeReq = app.testable.fakeRequest()
        let allTags = try! object.tags.query(on: fakeReq).all().await(on: fakeReq)
        for tag in tags {
            XCTAssertTrue(allTags.contains(name: tag), "Tag needs to be present")
            XCTAssertTrue(allTags.contains(identifier: tag.safeText), "Tag needs to be present")
        }
        
        count = app.testable.count(allFor: App.self)
        XCTAssertEqual(count, 108, "There should be right amount of apps to begin with")
    }
    
}



