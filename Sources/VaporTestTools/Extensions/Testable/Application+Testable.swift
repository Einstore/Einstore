//
//  Application+Testable.swift
//  VaporTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import Vapor
import Routing


extension TestableProperty where TestableType: Application {
    
    public typealias AppConfigClosure = ((_ config: inout Config, _ env: inout Vapor.Environment, _ services: inout Services) -> Void)
    public typealias AppRouterClosure = ((_ router: Router) -> Void)
    
    public static func new(config: Config = Config.default(), env: Environment? = nil, services: Services = Services.default(), _ configClosure: AppConfigClosure? = nil, _ routerClosure: AppRouterClosure) -> Application {
        var config = config
        var env = try! env ?? Environment.detect()
        var services = services
        
        configClosure?(&config, &env, &services)
        let app = try! Application(config: config, environment: env, services: services)
        
        let router = try! app.make(Router.self)
        routerClosure(router)
        
        return app
    }
    
    public func response(to request: HTTPRequest) -> Response {
        let responder = try! element.make(Responder.self)
        let wrappedRequest = Request(http: request, using: element)
        return try! responder.respond(to: wrappedRequest).blockingAwait()
    }
    
}

