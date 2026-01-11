# Einstore iOS Tracking

Lightweight Swift package for recording app download and launch events against the Einstore API.

## Install
- Add the Swift package at `frameworks/ios/EinstoreTracking`.

## Usage
```swift
import EinstoreTracking

let tracker = EinstoreTracker(
  config: EinstoreTrackingConfig(
    downloadUrl: URL(string: "https://api.einstore.dev/builds/BUILD_ID/downloads"),
    launchUrl: URL(string: "https://api.einstore.dev/builds/BUILD_ID/ios/installs/track?token=TOKEN"),
    headers: [
      "Authorization": "Bearer USER_TOKEN",
      "X-Team-Id": "TEAM_ID",
    ],
    targetId: "ios-app"
  )
)

tracker.trackLaunchOnce()
```

## Notes
- If you use the iOS install link flow, downloads are already recorded by the `/builds/:id/ios/download` endpoint.
- Point `launchUrl` at `/builds/:id/ios/installs/track?token=...` when using install tokens.
- If you use `/builds/:id/downloads` or `/builds/:id/installs`, the endpoint requires auth headers.
