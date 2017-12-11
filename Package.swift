// swift-tools-version:4.0
import PackageDescription

let package = Package(
    name: "Boost",
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", .branch("beta")),
        ],
    targets: [
        .target(
            name: "App",
            dependencies: [
                "Routing",
                "Service",
                "Vapor",
                "MySQL",
                "Redis",
                "JWT",
                "Crypto",
                "Validation",
                "MyBase"
            ]
        ),
        .target(
            name: "MyBase",
            dependencies: [
                "Vapor",
                "MySQL"
            ]
        ),
        .target(name: "Run", dependencies: [
            "App"
            ]),
        .testTarget(name: "AppTests", dependencies: ["App"]),
        ]
)

