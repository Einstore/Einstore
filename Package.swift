// swift-tools-version:4.0
import PackageDescription

let package = Package(
    name: "Boost",
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", .exact("3.0.0-beta.3.1.3")),
        .package(url: "https://github.com/vapor/fluent-postgresql.git", .exact("1.0.0-beta.3")),
        .package(url: "https://github.com/vapor/fluent.git", .exact("3.0.0-beta.3")),
//        .package(url: "https://github.com/vapor/jwt.git", .branch("beta")),
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
            name: "ErrorsCore",
            dependencies: [
                "Vapor"
            ]
        ),
        .target(
            name: "FileCore",
            dependencies: [
                "Vapor",
                "ErrorsCore"
            ]
        ),
        .target(
            name: "DbCore",
            dependencies: [
                "Vapor",
                "Fluent",
                "FluentPostgreSQL",
                "ErrorsCore"
            ]
        ),
        .target(
            name: "BoostCore",
            dependencies: [
                "Vapor",
                "Fluent",
                "FluentPostgreSQL",
                "ApiCore",
                "ErrorsCore",
                "DbCore",
                "SwiftShell",
                "FileCore"
            ]
        ),
        .target(
            name: "ApiCore",
            dependencies: [
                "Vapor",
                "Fluent",
                "FluentPostgreSQL",
                "ErrorsCore",
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
        .testTarget(name: "ErrorsCoreTests", dependencies: ["ErrorsCore"]),
        ]
)

