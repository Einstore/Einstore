//
//  ApkManifest.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 07/02/2018.
//

import Foundation
import ApiCore


struct ApkManifest: Codable {
    
    struct Manifest: Codable {
        
        struct Application: Codable {
            let identifier: String
            let nameAddress: String
            let roundIcon: String?
            let icon: String?
            
            enum CodingKeys: String, CodingKey {
                case identifier = "@{http://schemas.android.com/apk/res/android}name"
                case nameAddress = "@{http://schemas.android.com/apk/res/android}label"
                case roundIcon = "@{http://schemas.android.com/apk/res/android}roundIcon"
                case icon = "@{http://schemas.android.com/apk/res/android}icon"
            }
        }
        
        struct Permission: Codable {
            let name: String
            
            enum CodingKeys: String, CodingKey {
                case name = "@{http://schemas.android.com/apk/res/android}name"
            }
        }
        
        let package: String
        let platformBuildVersionName: String?
        let platformBuildVersionCode: String?
        let application: Application
        let usesPermission: [Permission]
        
        
        enum CodingKeys: String, CodingKey {
            case package = "@package"
            case platformBuildVersionName = "@platformBuildVersionName"
            case platformBuildVersionCode = "@platformBuildVersionCode"
            case application = "application"
            case usesPermission = "uses-permission"
        }
        
    }
    
    let manifest: Manifest
    
    enum CodingKeys: String, CodingKey {
        case manifest
    }
    
}


extension ApkManifest: JSONDecodable {
    public typealias ModelType = ApkManifest
}
