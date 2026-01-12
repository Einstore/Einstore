# Einstore iOS Tracking

Swift package for recording app downloads, launches, and analytics events against the Einstore API.

## Install
- Add the Swift package at `frameworks/ios/EinstoreTracking`.

## Usage
```swift
import EinstoreTracking

let tracker = EinstoreTracker(
  config: EinstoreTrackingConfig(
    baseUrl: URL(string: "https://api.einstore.dev"),
    buildId: "BUILD_ID",
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
- If you need signed install tracking, set a tokenized `launchUrl`; otherwise the SDK builds `/builds/{id}/installs` from `baseUrl` + `buildId`.
- If you omit `baseUrl`, you can still pass full URLs via `downloadUrl` / `launchUrl` / `eventUrl`.
