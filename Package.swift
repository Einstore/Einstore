// swift-tools-version:4.0
import PackageDescription

let package = Package(
    name: "Boost",
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", from: "3.0.0-rc.2"),
        .package(url: "https://github.com/vapor/fluent.git", from: "3.0.0-rc.2"),
        .package(url: "https://github.com/vapor/fluent-postgresql.git", from: "1.0.0-rc.2"),
        .package(url: "https://github.com/LiveUI/BoostCore.git", .branch("master")),
        .package(url: "https://github.com/LiveUI/DbCore.git", .branch("master")),
        .package(url: "https://github.com/LiveUI/VaporTestTools.git", .branch("master"))
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
            name: "BumpUpCore",
            dependencies: [
                "Vapor",
                "Fluent",
                "FluentPostgreSQL",
                "DbCore"
            ]
        ),
        .target(name: "Run", dependencies: [
            "App"
            ]
        ),
        .testTarget(name: "AppTests", dependencies: [
            "App",
            "VaporTestTools"
            ]
        )
    ]
)

