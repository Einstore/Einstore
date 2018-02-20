import Foundation
import Vapor
import BoostCore
import DbCore
import ApiCore
import FileCore


/// Called before your application initializes.
///
/// [Learn More →](https://docs.vapor.codes/3.0/getting-started/structure/#configureswift)

public func configure(_ config: inout Config, _ env: inout Vapor.Environment, _ services: inout Services) throws {
    print("Starting Boost")
    Env.print()
    
    var boostConfig = BoostConfig()
    boostConfig.database = DbCore.envConfig(defaultDatabase: "boost")
    // TODO: Make this come from an ENV var
    boostConfig.fileHandler = try Filesystem(config: Filesystem.Config(homeDir: "/tmp/Boost/"))
    try Boost.configure(boostConfig: &boostConfig, &config, &env, &services)
}
