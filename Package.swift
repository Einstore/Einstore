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
                "Boost"
            ]
        ),
        .target(
            name: "MyErrors",
            dependencies: [
                "Routing",
                "Service",
                "Vapor"
            ]
        ),
        .target(
            name: "Boost",
            dependencies: [
                "Routing",
                "Service",
                "Vapor",
                "MySQL",
                "Redis",
                "JWT",
                "Crypto",
                "Validation",
                "MyBase",
                "MyErrors"
            ]
        ),
        .target(
            name: "MyBase",
            dependencies: [
                "Routing",
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

