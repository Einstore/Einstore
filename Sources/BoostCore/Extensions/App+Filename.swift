//
//  App+Filename.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 21/02/2018.
//

import Foundation
import Vapor


extension App {
    
    public var iconName: String {
        return "icon.png"
    }
    
    public var fileName: String {
        return "app.\(platform.fileExtension)"
    }
    
    public var targetFolderPath: URL? {
        guard let id = self.id, let created = self.created else {
            return nil
        }
        return URL(fileURLWithPath: Boost.config.storageFileConfig.mainFolderPath)
            .appendingPathComponent(created.dateFolderPath)
            .appendingPathComponent(id.uuidString)
    }
    
    public var iconPath: URL? {
        return targetFolderPath?.appendingPathComponent(iconName)
    }
    
    public var appPath: URL? {
        return targetFolderPath?.appendingPathComponent(fileName)
    }
    
    public static func tempAppFolder(on req: Request) -> URL {
        return URL(fileURLWithPath: Boost.config.tempFileConfig.mainFolderPath).appendingPathComponent(req.sessionId.uuidString)
    }
    
    public static func tempAppFile(on req: Request) -> URL {
        return tempAppFolder(on: req).appendingPathComponent("tmp.boost")
    }
    
}
