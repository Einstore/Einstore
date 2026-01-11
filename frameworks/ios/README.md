# Einstore iOS Tracking

Swift package for recording app downloads, launches, and analytics events against the Einstore API.

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
    services: [.analytics, .distribution, .devices, .usage],
    targetId: "ios-app"
  )
)

tracker.trackLaunchOnce()
```

## Services
Pass the sections you want to track via `services`:
- `.analytics`: app launches, sessions, screen views, custom events, user properties.
- `.errors`: handled exceptions that you explicitly log.
- `.distribution`: install source and version rollout metadata.
- `.devices`: model, manufacturer, OS version, locale, app version.
- `.usage`: time, time zone, session duration (country/region inferred by API).

## Notes
- Crashes are not tracked yet.
- If you use the iOS install link flow, downloads are already recorded by `/builds/:id/ios/download`.
- Point `launchUrl` at `/builds/:id/ios/installs/track?token=...` when using install tokens.
- `eventUrl` can override where analytics/errors events are posted (defaults to `launchUrl`).
