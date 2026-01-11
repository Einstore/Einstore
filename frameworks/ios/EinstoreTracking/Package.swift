// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "EinstoreTracking",
  platforms: [.iOS(.v13)],
  products: [
    .library(name: "EinstoreTracking", targets: ["EinstoreTracking"]),
  ],
  targets: [
    .target(name: "EinstoreTracking"),
  ]
)
