import Foundation
import Vapor
import BoostCore
import DbCore
import ApiCore
import MailCore


public func configure(_ config: inout Config, _ env: inout Vapor.Environment, _ services: inout Services) throws {
    print("Starting Boost")
    Env.print()
    
    // Register routes
    let router = EngineRouter.default()
    try routes(router)
    services.register(router, as: Router.self)
    
    // Configuration
    var boostConfig = BoostConfig()
    
    // Database
    boostConfig.database = DbCore.envConfig(defaultDatabase: "boost")
    
    // Emails
    guard let mailGunApi = Environment.get("MAILGUN_API"),  let mailGunDomain = Environment.get("MAILGUN_DOMAIN") else {
        fatalError("Mailgun API key or domain is missing")
    }
    boostConfig.mail = Mailer.Config.mailgun(key: mailGunApi, domain: mailGunDomain)
    
    // Settings
    
    // Go!
    try Boost.configure(boostConfig: &boostConfig, &config, &env, &services)
}
