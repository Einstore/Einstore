//
//  Application+Testable.swift
//  ApiCoreTestTools
//
//  Created by Ondrej Rafaj on 27/02/2018.
//

import Foundation
import ApiCore
import Vapor
import VaporTestTools


extension TestableProperty where TestableType: Application {
    
    public static func newApiCoreTestApp(_ configClosure: AppConfigClosure? = nil, _ routerClosure: AppRouterClosure? = nil) -> Application {
        let app = new({ (config, env, services) in
            try! ApiCore.configure(&config, &env, &services)
            configClosure?(&config, &env, &services)
        }) { (router) in
            try! ApiCore.boot(router: router)
            routerClosure?(router)
        }
        return app
    }
    
}
