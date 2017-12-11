import Vapor
import FluentMySQL
import MyBase

/// Called before your application initializes.
///
/// [Learn More →](https://docs.vapor.codes/3.0/getting-started/structure/#configureswift)

public func configure(_ config: inout Config, _ env: inout Environment, _ services: inout Services) throws {
//    let databaseIdentifier = DatabaseIdentifier<MySQLDatabase>("mysql")
//    var databaseConfig = DatabaseConfig()
//    let mysql = MySQLDatabase(hostname: "localhost", user: "root", password: nil, database: "boost")
//    databaseConfig.add(database: mysql, as: databaseIdentifier)
//    services.register(databaseConfig)
//
//    try services.register(FluentProvider())
}
