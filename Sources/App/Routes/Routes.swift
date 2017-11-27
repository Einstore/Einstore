import Vapor

extension Droplet {
    
    func setupRoutes() throws {
        try resource("apps", AppsController.self)
    }
    
}
