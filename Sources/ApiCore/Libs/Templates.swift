//
//  Templates.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 23/03/2018.
//

import Foundation
import ErrorsCore
import Vapor


public class Templates {
    
    public enum Problem: FrontendError {
        case templateUnavailable
        
        public var code: String {
            return "template"
        }
        
        public var description: String {
            return "Template not available"
        }
        
        public var status: HTTPStatus {
            return .notImplemented
        }
        
    }
    
    public enum Which {
        case string
        case html
    }
    
    static var templates: [Template.Type] = [
        RegistrationTemplate.self
    ]
    
    // MARK: Public interface
    
    public static func installMissing() {
        for template in templates {
            if !exists(template, type: .string) {
                create(template, type: .string)
            }
            if !exists(template, type: .html) {
                create(template, type: .html)
            }
        }
    }
    
    public static func resetTemplates() {
        for template in templates {
            create(template, type: .string)
            create(template, type: .html)
        }
    }
    
    // MARK: Private interface
    
    private static func exists(_ template: Template.Type, type: Which) -> Bool {
        return FileManager.default.fileExists(atPath: (type == .string ? template.stringPath.path : template.htmlPath.path))
    }
    
    private static func create(_ template: Template.Type, type: Which) {
        do {
            if type == .string {
                try template.string.write(to: template.stringPath, atomically: true, encoding: .utf8)
            } else {
                try template.html?.write(to: template.htmlPath, atomically: true, encoding: .utf8)
            }
        } catch {
            if type == .string {
                fatalError("Unable to save default template \(template.name) to path: \(template.stringPath)")
            } else {
                fatalError("Unable to save default template \(template.name) to path: \(template.htmlPath)")
            }
        }
    }
    
}
