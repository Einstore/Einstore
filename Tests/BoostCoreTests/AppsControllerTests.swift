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
import ErrorsCore
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
//        ("testDeleteApp", testDeleteApp),
        ("testCantDeleteOtherPeoplesApp", testCantDeleteOtherPeoplesApp),
        ("testOldIosApp", testOldIosApp),
        ("testOldIosAppTokenUpload", testOldIosAppTokenUpload),
        ("testUnobfuscatedApkUploadWithJWTAuth", testUnobfuscatedApkUploadWithJWTAuth),
        ("testObfuscatedApkUploadWithJWTAuth", testObfuscatedApkUploadWithJWTAuth),
        ("testBadTokenUpload", testBadTokenUpload),
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
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let objects = r.response.testable.content(as: Apps.self)!
        
        XCTAssertEqual(objects.count, 99, "There should be right amount of apps")
        
        XCTAssertTrue(r.response.testable.has(statusCode: .ok), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
    }
    
    /*
    func testDeleteApp() {
        var count = app.testable.count(allFor: App.self)
        XCTAssertEqual(count, 107, "There should be right amount of apps to begin with")
        
        let req = try! HTTPRequest.testable.delete(uri: "/apps/\(app1.id!.uuidString)".makeURI(), authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        // TODO: Test all tags were deleted!!!!
        // TODO: Test all files were deleted!!!!
        
        XCTAssertTrue(r.response.testable.has(statusCode: .noContent), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        count = app.testable.count(allFor: App.self)
        XCTAssertEqual(count, 106, "There should be right amount of apps to finish with")
    }
    // */
    
    func testCantDeleteOtherPeoplesApp() {
        var count = app.testable.count(allFor: App.self)
        XCTAssertEqual(count, 107, "There should be right amount of apps to begin with")
        
        let req = try! HTTPRequest.testable.delete(uri: "/apps/\(app2.id!.uuidString)".makeURI(), authorizedUser: user1, on: app)
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let object = app.testable.one(for: App.self, id: app2!.id!)
        let tagsCount = try! object!.tags.query(on: r.request).count().await(on: r.request)
        XCTAssertEqual(tagsCount, 2)
        
        // TODO: Test files are still there!!!
        
        XCTAssertTrue(r.response.testable.has(statusCode: .notFound), "Wrong status code")
        XCTAssertTrue(r.response.testable.has(contentType: "application/json; charset=utf-8"), "Missing content type")
        
        count = app.testable.count(allFor: App.self)
        XCTAssertEqual(count, 107, "There should be right amount of apps to finish with")
    }
    
    func testOldIosApp() {
        doTestJWTUpload(appFileName: "app.ipa", platform: .ios, name: "iDeviant", identifier: "com.fuerteint.iDeviant", version: "4.0", build: "1.0", iconSize: 4776)
    }
    
    func testOldIosAppTokenUpload() {
        doTestTokenUpload(appFileName: "app.ipa", platform: .ios, name: "iDeviant", identifier: "com.fuerteint.iDeviant", version: "4.0", build: "1.0", iconSize: 4776)
    }
    
    func testBadTokenUpload() {
        let appUrl = Application.testable.paths.resourcesUrl.appendingPathComponent("Demo").appendingPathComponent("app.ipa")
        let postData = try! Data(contentsOf: appUrl)
        let req = try! HTTPRequest.testable.post(uri: "/apps?token=bad_token_yo".makeURI(), data: postData, headers: [
            "Content-Type": "application/octet-stream"
            ]
        )
        
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let object = r.response.testable.content(as: ErrorResponse.self)!
        
        XCTAssertEqual(object.error, "auth_error", "Wrong code")
        XCTAssertEqual(object.description, "Authentication has failed", "Wrong desctiption")
    }
    
    func testUnobfuscatedApkUploadWithJWTAuth() {
        // TODO: Make another app!!!!!!!!!
        doTestJWTUpload(appFileName: "app.apk", platform: .android, name: "Bytecheck", identifier: "cz.vhrdina.bytecheck.ByteCheckApplication", version: "7.1.1", build: "25", iconSize: 2018)
        // TODO: Test token upload
    }
    
    func testObfuscatedApkUploadWithJWTAuth() {
        doTestJWTUpload(appFileName: "app-obfuscated.apk", platform: .android, name: "BoostTest", identifier: "io.liveui.boosttest", iconSize: 9250)
    }
    
}


extension AppsControllerTests {
    
    private func doTestTokenUpload(appFileName fileName: String, platform: App.Platform, name: String, identifier: String, version: String? = nil, build: String? = nil, tags: [String] = ["tagging_like_crazy", "All Year Round"], iconSize: Int? = nil) {
        let appUrl = Application.testable.paths.resourcesUrl.appendingPathComponent("Demo").appendingPathComponent(fileName)
        let postData = try! Data(contentsOf: appUrl)
        let encodedTags: String = tags.joined(separator: "|").addingPercentEncoding(withAllowedCharacters: .urlHostAllowed)!
        let req = try! HTTPRequest.testable.post(uri: "/apps?tags=\(encodedTags)&token=\(key1.token)".makeURI(), data: postData, headers: [
            "Content-Type": (platform == .ios ? "application/octet-stream" : "application/vnd.android.package-archive")
            ]
        )
        
        doTest(request: req, platform: platform, name: name, identifier: identifier, version: version, build: build, tags: tags, iconSize: iconSize)
    }
    
    private func doTestJWTUpload(appFileName fileName: String, platform: App.Platform, name: String, identifier: String, version: String? = nil, build: String? = nil, tags: [String] = ["tagging_like_crazy", "All Year Round"], iconSize: Int? = nil) {
        let appUrl = Application.testable.paths.resourcesUrl.appendingPathComponent("Demo").appendingPathComponent(fileName)
        let postData = try! Data(contentsOf: appUrl)
        let encodedTags: String = tags.joined(separator: "|").addingPercentEncoding(withAllowedCharacters: .urlHostAllowed)!
        let req = try! HTTPRequest.testable.post(uri: "/teams/\(team1.id!.uuidString)/apps?tags=\(encodedTags)".makeURI(), data: postData, headers: [
            "Content-Type": (platform == .ios ? "application/octet-stream" : "application/vnd.android.package-archive")
            ], authorizedUser: user1, on: app
        )
        
        doTest(request: req, platform: platform, name: name, identifier: identifier, version: version, build: build, tags: tags, iconSize: iconSize)
    }
    
    @discardableResult private func doTest(request req: HTTPRequest, platform: App.Platform, name: String, identifier: String, version: String?, build: String?, tags: [String], iconSize: Int?) -> TestResponse {
        // Check initial app count
        var count = app.testable.count(allFor: App.self)
        XCTAssertEqual(count, 107, "There should be right amount of apps to begin with")
        
        let r = app.testable.response(to: req)
        
        r.response.testable.debug()
        
        let object = r.response.testable.content(as: App.self)!
        
        // Check parsed values
        XCTAssertEqual(object.platform, platform, "Wrong platform")
        XCTAssertEqual(object.name, name, "Wrong name")
        XCTAssertEqual(object.identifier, identifier, "Wrong identifier")
        XCTAssertEqual(object.version, version ?? "0.0", "Wrong version")
        XCTAssertEqual(object.build, build ?? "0", "Wrong build")
        
        // Temp file should have been deleted
        var pathUrl = App.tempAppFile(on: r.request)
        XCTAssertFalse(FileManager.default.fileExists(atPath: pathUrl.path), "Temporary file should have been deleted")
        
        // App should be saved in the persistent storage
        pathUrl = object.appPath!
        XCTAssertTrue(FileManager.default.fileExists(atPath: pathUrl.path), "Persistent file should be present")
        
        // Test images are all ok
        if let iconSize = iconSize, let iconPath = object.iconPath {
            XCTAssertTrue(FileManager.default.fileExists(atPath: iconPath.path), "Icon file should be present")
            XCTAssertEqual(try! Data(contentsOf: iconPath).count, iconSize, "Icon file size doesn't match")
        }
        else if object.hasIcon {
            XCTFail("Icon is set on the App object but it has not been tested")
        }
        
        // TODO: Test iOS images are decoded!!!!!!!!!
        
        // Check all created tags
        let fakeReq = app.testable.fakeRequest()
        let allTags = try! object.tags.query(on: fakeReq).all().await(on: fakeReq)
        for tag in tags {
            XCTAssertTrue(allTags.contains(name: tag), "Tag needs to be present")
            XCTAssertTrue(allTags.contains(identifier: tag.safeText), "Tag needs to be present")
        }
        
        // Check final app count after the upload
        count = app.testable.count(allFor: App.self)
        XCTAssertEqual(count, 108, "There should be right amount of apps to begin with")
        
        return r
    }
    
}



