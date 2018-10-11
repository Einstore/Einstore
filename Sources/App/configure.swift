import Foundation
import Vapor
import BoostCore
import ApiCore
import MailCore


public func configure(_ config: inout Vapor.Config, _ env: inout Vapor.Environment, _ services: inout Services) throws {
    print("Starting Boost SdnTgJsglfkjVQZUO")
    Env.print()
    
    // Register routes
    let router = EngineRouter.default()
    try routes(router)
    services.register(router, as: Router.self)
    
    // Go!
    try BoostCoreBase.configure(&config, &env, &services)
}
