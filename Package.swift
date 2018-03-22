// swift-tools-version:4.0
import PackageDescription

let package = Package(
    name: "Boost",
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", from: "3.0.0-rc.2"),
        .package(url: "https://github.com/vapor/fluent.git", from: "3.0.0-rc.2"),
        .package(url: "https://github.com/vapor/fluent-postgresql.git", from: "1.0.0-rc.2"),
        .package(url: "https://github.com/vapor/jwt.git", from: "3.0.0-rc.2"),
        .package(url: "https://github.com/kareman/SwiftShell.git", from: "4.0.2"),
        .package(url: "https://github.com/LiveUI/VaporTestTools.git", .branch("master")),
        .package(url: "https://github.com/twof/VaporMailgunService.git", from: "0.3.0")
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
            name: "MailCore",
            dependencies: [
                "Vapor",
                "Mailgun"
            ]
        ),
        .target(
            name: "MailCoreTestTools",
            dependencies: [
                "Vapor",
                "VaporTestTools",
                "MailCore"
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
            name: "BumpUpCore",
            dependencies: [
                "Vapor",
                "Fluent",
                "FluentPostgreSQL",
                "DbCore"
            ]
        ),
        .target(
            name: "SettingsCore",
            dependencies: [
                "Vapor",
                "DbCore",
                "ApiCore",
                "Fluent",
                "FluentPostgreSQL",
                "FileCore",
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
                "FileCore",
                "MailCore",
                "SettingsCore"
            ]
        ),
        .target(
            name: "ApiCore",
            dependencies: [
                "Vapor",
                "Fluent",
                "FluentPostgreSQL",
                "ErrorsCore",
                "DbCore",
                "JWT",
                "MailCore"
            ]
        ),
        .target(
            name: "ApiCoreTestTools",
            dependencies: [
                "Vapor",
                "ApiCore",
                "VaporTestTools",
                "FluentTestTools",
                "MailCoreTestTools"
            ]
        ),
        .target(
            name: "FluentTestTools",
            dependencies: [
                "Vapor",
                "VaporTestTools"
            ]
        ),
        .target(
            name: "BoostTestTools",
            dependencies: [
                "Vapor",
                "ApiCore",
                "BoostCore",
                "VaporTestTools",
                "ApiCoreTestTools",
                "MailCoreTestTools"
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
        ),
        .testTarget(name: "ApiCoreTests", dependencies: [
            "ApiCore",
            "VaporTestTools",
            "FluentTestTools",
            "ApiCoreTestTools"
            ]
        ),
        .testTarget(name: "SettingsCoreTests", dependencies: [
            "SettingsCore",
            "ApiCore",
            "VaporTestTools",
            "FluentTestTools",
            "ApiCoreTestTools"
            ]
        ),
        .testTarget(name: "BoostCoreTests", dependencies: [
            "BoostCore",
            "VaporTestTools",
            "FluentTestTools",
            "ApiCoreTestTools",
            "BoostTestTools"
            ]
        ),
        .testTarget(name: "DbCoreTests", dependencies: [
            "DbCore",
            "VaporTestTools"
            ]
        ),
        .testTarget(name: "ErrorsCoreTests", dependencies: [
            "ErrorsCore",
            "VaporTestTools"
            ]
        )
    ]
)

