import Vapor
import FluentProvider
import HTTP


final class App: Model {
    
    let storage = Storage()
    
    // MARK: Properties and database keys
    
    enum Platform: Int {
        case ios = 1
        case android = 2
    }
    
    var name: String
    var detail: String
    var bundleId: String
    var platform: Platform  
    
    struct Keys {
        static let id = "id"
        static let detail = "detail"
        static let bundleId = "identifier"
        static let platform = "platform"
    }

    init(detail: String) {
        self.detail = detail
    }

    // MARK: Fluent Serialization

    init(row: Row) throws {
        detail = try row.get(App.Keys.detail)
    }

    func makeRow() throws -> Row {
        var row = Row()
        try row.set(App.Keys.detail, detail)
        return row
    }
}

// MARK: Fluent Preparation

extension App: Preparation {
    
    static func prepare(_ database: Database) throws {
        try database.create(self) { builder in
            builder.id()
            builder.string(App.Keys.detail)
        }
    }

    static func revert(_ database: Database) throws {
        try database.delete(self)
    }
    
}

// MARK: JSON

// How the model converts from / to JSON.
// For example when:
//     - Creating a new App (POST /apps)
//     - Fetching a app (GET /apps, GET /apps/:id)
//
extension App: JSONConvertible {
    
    convenience init(json: JSON) throws {
        self.init(
            detail: try json.get(App.Keys.detail)
        )
    }
    
    func makeJSON() throws -> JSON {
        var json = JSON()
        try json.set(App.Keys.id, id)
        try json.set(App.Keys.detail, detail)
        return json
    }
    
}

// MARK: HTTP

// This allows App models to be returned
// directly in route closures
extension App: ResponseRepresentable { }

// MARK: Update

// This allows the App model to be updated
// dynamically by the request.
extension App: Updateable {
    
    // Updateable keys are called when `app.update(for: req)` is called.
    // Add as many updateable keys as you like here.
    public static var updateableKeys: [UpdateableKey<App>] {
        return [
            // If the request contains a String at key "detail"
            // the setter callback will be called.
            UpdateableKey(App.Keys.detail, String.self) { app, detail in
                app.detail = detail
            }
        ]
    }
    
}
