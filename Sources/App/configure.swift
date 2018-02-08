import Foundation
import Vapor
import BoostCore
import DbCore
import ApiCore


/// Called before your application initializes.
///
/// [Learn More →](https://docs.vapor.codes/3.0/getting-started/structure/#configureswift)

public func configure(_ config: inout Config, _ env: inout Vapor.Environment, _ services: inout Services) throws {
    Env.print()
    
    var boostConfig = BoostConfig()
    boostConfig.database = DbCore.envConfig(defaultDatabase: "boost")
    try Boost.configure(boostConfig: &boostConfig, &config, &env, &services)
}
