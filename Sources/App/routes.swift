import Routing
import Vapor
import BoostCore

/// Register your application's routes here.
///
/// [Learn More →](https://docs.vapor.codes/3.0/getting-started/structure/#routesswift)

final class Routes: RouteCollection {
    
    /// Use this to create any services you may
    /// need for your routes.
    let app: Application
    
    // MARK: Initialization
    
    init(app: Application) {
        self.app = app
    }
    
    
    // MARK: Boot
    
    func boot(router: Router) throws {
        try Boost.boot(router: router)
    }
}
