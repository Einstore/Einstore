import Routing
import Vapor
import MyBase

/// Register your application's routes here.
///
/// [Learn More →](https://docs.vapor.codes/3.0/getting-started/structure/#routesswift)

final class Routes: RouteCollection {
    
    /// Use this to create any services you may
    /// need for your routes.
    let app: Application
    
    var controllers: [Controller.Type] = [
        TagsController.self
    ]

    // MARK: Initialization
    
    init(app: Application) {
        self.app = app
    }
    
    // MARK: Boot
    
    func boot(router: Router) throws {
        try MyBase.boot(router: router)
        
        for c in controllers {
            try c.boot(router: router)
        }
    }
}
