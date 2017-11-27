//
//  AppsController.swift
//  App
//
//  Created by Ondrej Rafaj on 27/11/2017.
//


import Vapor
import HTTP

/// Here we have a controller that helps facilitate
/// RESTful interactions with our Apps table
final class AppsController: ResourceRepresentable {
    
    /// When users call 'GET' on '/apps'
    /// it should return an index of all available apps
    func index(_ req: Request) throws -> ResponseRepresentable {
        return try  App.all().makeJSON()
    }

    /// When consumers call 'POST' on '/apps' with valid JSON
    /// construct and save the app
    func store(_ req: Request) throws -> ResponseRepresentable {
        let app = try req.app()
        try app.save()
        return app
    }

    /// When the consumer calls 'GET' on a specific resource, ie:
    /// '/apps/13rd88' we should show that specific app
    func show(_ req: Request, app: App) throws -> ResponseRepresentable {
        return app
    }

    /// When the consumer calls 'DELETE' on a specific resource, ie:
    /// 'apps/l2jd9' we should remove that resource from the database
    func delete(_ req: Request, app: App) throws -> ResponseRepresentable {
        try app.delete()
        return Response(status: .ok)
    }

    /// When the consumer calls 'DELETE' on the entire table, ie:
    /// '/apps' we should remove the entire table
    func clear(_ req: Request) throws -> ResponseRepresentable {
        try App.makeQuery().delete()
        return Response(status: .ok)
    }

    /// When the user calls 'PATCH' on a specific resource, we should
    /// update that resource to the new values.
    func update(_ req: Request, app: App) throws -> ResponseRepresentable {
        // See `extension App: Updateable`
        try app.update(for: req)

        // Save an return the updated app.
        try app.save()
        return app
    }

    /// When a user calls 'PUT' on a specific resource, we should replace any
    /// values that do not exist in the request with null.
    /// This is equivalent to creating a new App with the same ID.
    func replace(_ req: Request, app: App) throws -> ResponseRepresentable {
        // First attempt to create a new App from the supplied JSON.
        // If any required fields are missing, this request will be denied.
        let new = try req.app()

        // Update the app with all of the properties from
        // the new app
        app.content = new.content
        try app.save()

        // Return the updated app
        return app
    }

    /// When making a controller, it is pretty flexible in that it
    /// only expects closures, this is useful for advanced scenarios, but
    /// most of the time, it should look almost identical to this 
    /// implementation
    func makeResource() -> Resource<App> {
        return Resource(
            index: index,
            store: store,
            show: show,
            update: update,
            replace: replace,
            destroy: delete,
            clear: clear
        )
    }
}

extension Request {
    /// Create a app from the JSON body
    /// return BadRequest error if invalid 
    /// or no JSON
    func app() throws -> App {
        guard let json = json else { throw Abort.badRequest }
        return try App(json: json)
    }
}

/// Since AppController doesn't require anything to
/// be initialized we can conform it to EmptyInitializable.
///
/// This will allow it to be passed by type.
extension AppsController: EmptyInitializable { }
