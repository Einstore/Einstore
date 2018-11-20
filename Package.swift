// swift-tools-version:4.0
import PackageDescription

let package = Package(
    name: "Boost",
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", from: "3.0.0"),
        .package(url: "https://github.com/LiveUI/BoostCore.git", .branch("master")),
        .package(url: "https://github.com/LiveUI/VaporTestTools.git", from: "0.1.5")
    ],
    targets: [
        .target(
            name: "App",
            dependencies: [
                "Vapor",
                "BoostCore"
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

