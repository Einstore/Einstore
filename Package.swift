// swift-tools-version:4.0
import PackageDescription

let package = Package(
    name: "Boost",
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", .branch("beta")),
        .package(url: "https://github.com/vapor/mysql.git", .branch("beta")),
        .package(url: "https://github.com/vapor/redis.git", .branch("beta")),
        .package(url: "https://github.com/vapor/jwt.git", .branch("beta"))
        ],
    targets: [
        .target(
            name: "App",
            dependencies: [
                "Vapor",
                "Boost"
            ]
        ),
        .target(
            name: "MyErrors",
            dependencies: [
                "Vapor"
            ]
        ),
        .target(
            name: "Boost",
            dependencies: [
                "Vapor",
                "MySQL",
                "Redis",
                "JWT",
                "MyBase",
                "MyErrors"
            ]
        ),
        .target(
            name: "MyBase",
            dependencies: [
                "Vapor",
                "MySQL",
                "MyErrors"
            ]
        ),
        .target(name: "Run", dependencies: [
            "App"
            ]),
        .testTarget(name: "AppTests", dependencies: ["App"]),
        ]
)

