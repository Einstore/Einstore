# Einstore iOS Tracking

Swift package for recording app downloads, launches, and analytics events against the Einstore API.

## Install
- Add the Swift package at `frameworks/ios/EinstoreTracking`.

## Usage
```swift
import EinstoreTracking

let tracker = EinstoreTracker(
  config: EinstoreTrackingConfig(
    baseUrl: URL(string: "https://api.einstore.dev"), // optional, defaults to Einstore API
    headers: [
      "Authorization": "Bearer USER_TOKEN"
    ],
    services: [.analytics, .distribution, .devices, .usage, .crashes], // defaults to distribution + devices if omitted
    crashEnabled: true
  )
)

tracker.trackLaunchOnce()

// Capture crashes via your existing handler and enqueue for next-launch upload:
tracker.recordCrash([
  "exceptionType": "SIGABRT",
  "stackTrace": "Thread 1 ...",
  "occurredAt": ISO8601DateFormatter().string(from: Date()),
  "binaryHash": "hash-of-binary"
])
// Pending crashes upload on init when crashEnabled and .crashes are enabled.
```

## Services
Pass the sections you want to track via `services`:
- `.analytics`: app launches, sessions, screen views, custom events, user properties.
- `.errors`: handled exceptions that you explicitly log.
- `.distribution`: install source and version rollout metadata.
- `.devices`: model, manufacturer, OS version, locale, app version.
- `.usage`: time, time zone, session duration (country/region inferred by API).
- `.crashes`: crash reports you enqueue for next-launch upload.
If you omit `services`, the SDK defaults to `distribution` and `devices`.

## Notes
- Crash capture: aggregation-first; we do not install crash handlers. Use your existing crash SDK to capture and call `recordCrash`. Uploads happen on next launch when `crashEnabled` and `.crashes` are enabled. Symbolication via dSYMs is required.
- If you use the iOS install link flow, downloads are already recorded by `/builds/:id/ios/download`.
- If you need signed install tracking, set a tokenized `launchUrl`; otherwise the SDK builds endpoints from `baseUrl` and falls back to `/tracking/events` when no build ID is set.
- If you omit `baseUrl`, you can still pass full URLs via `downloadUrl` / `launchUrl` / `eventUrl`.
- `targetId` is filled from your bundle identifier automatically when not provided.
- Build resolution on the API side uses `targetId` + app version/build number, so you generally do not need to provide a build ID.
