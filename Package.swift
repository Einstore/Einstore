// swift-tools-version:4.0
import PackageDescription

let package = Package(
    name: "Boost",
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", .exact("3.0.0-alpha.12")),
        .package(url: "https://github.com/manGoweb/MimeLib.git", .exact("1.0.0")),
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
            name: "SQLEncoder",
            dependencies: [
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
                "MyErrors",
                "SQLEncoder"
            ]
        ),
        .target(
            name: "MyBase",
            dependencies: [
                "Routing",
                "Vapor",
                "MySQL",
                "MyErrors",
                "SQLEncoder"
            ]
        ),
        .target(name: "Run", dependencies: [
            "App"
            ]),
        .testTarget(name: "AppTests", dependencies: ["App"]),
        ]
)

