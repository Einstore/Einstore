// swift-tools-version:4.0
import PackageDescription

let package = Package(
    name: "Boost",
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", .branch("beta")),
        .package(url: "https://github.com/vapor/mysql.git", .branch("beta")),
        .package(url: "https://github.com/vapor/mysql-driver.git", .branch("beta")),
        .package(url: "https://github.com/vapor/fluent.git", .branch("beta")),
        .package(url: "https://github.com/vapor/redis.git", .branch("beta")),
        .package(url: "https://github.com/vapor/jwt.git", .branch("beta")),
        .package(url: "https://github.com/manGoweb/MimeLib.git", .exact("1.0.0")),
        .package(url: "https://github.com/kareman/SwiftShell.git", .exact("4.0.0"))
    ],
    targets: [
        .target(
            name: "App",
            dependencies: [
                "Vapor",
                "BoostCore"
            ]
        ),
        .target(
            name: "ApiErrors",
            dependencies: [
                "Vapor"
            ]
        ),
        .target(
            name: "SQLEncoder",
            dependencies: [
            ]
        ),
        .target(
            name: "MySQLPool",
            dependencies: [
                "Vapor",
                "MySQL"
            ]
        ),
        .target(
            name: "DbCore",
            dependencies: [
                "Vapor",
                "MySQL",
                "Fluent",
                "FluentMySQL",
                "ApiErrors"
            ]
        ),
        .target(
            name: "BoostCore",
            dependencies: [
                "Vapor",
                "MySQL",
                "Fluent",
                "FluentMySQL",
                "Redis",
                "JWT",
                "ApiCore",
                "ApiErrors",
                "SQLEncoder",
                "DbCore",
                "SwiftShell"
            ]
        ),
        .target(
            name: "ApiCore",
            dependencies: [
                "Vapor",
                "MySQL",
                "Fluent",
                "FluentMySQL",
                "ApiErrors",
                "SQLEncoder",
                "DbCore"
            ]
        ),
        .target(name: "Run", dependencies: [
            "App"
            ]),
        .testTarget(name: "AppTests", dependencies: ["App"]),
        .testTarget(name: "ApiCoreTests", dependencies: ["ApiCore"]),
        .testTarget(name: "BoostCoreTests", dependencies: ["BoostCore"]),
        .testTarget(name: "DbCoreTests", dependencies: ["DbCore"]),
        .testTarget(name: "ApiErrorsTests", dependencies: ["ApiErrors"]),
        ]
)

