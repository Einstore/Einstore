import Routing
import Vapor
import BoostCore

/// Register your application's routes here.
///
/// [Learn More →](https://docs.vapor.codes/3.0/getting-started/structure/#routesswift)
public func routes(_ router: Router) throws {
    try Boost.boot(router: router)
}
