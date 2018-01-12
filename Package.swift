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
        .package(url: "https://github.com/manGoweb/MimeLib.git", .exact("1.0.0"))
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
            ]
        ),
        .target(
            name: "DbCore",
            dependencies: [
                "MySQL",
                "Vapor",
                "Fluent",
                "FluentMySQL"
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
                "DbCore"
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
        ]
)

