import Vapor
import BoostCore

/// Called before your application initializes.
///
/// [Learn More →](https://docs.vapor.codes/3.0/getting-started/structure/#configureswift)

public func configure(_ config: inout Config, _ env: inout Environment, _ services: inout Services) throws {
    try Boost.configure(&config, &env, &services)
}
