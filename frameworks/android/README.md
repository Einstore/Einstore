# Einstore Android Tracking

Android library for recording app downloads, launches, and analytics events against the Einstore API.

## Install
- Copy `frameworks/android` into your repo and include it as a Gradle module.

## Usage
```kotlin
val tracker = EinstoreTracker(
  context = applicationContext,
  config = EinstoreTrackingConfig(
    baseUrl = "https://api.einstore.dev", // optional, defaults to Einstore API
    headers = mapOf(
      "Authorization" to "Bearer USER_TOKEN"
    ),
    services = setOf(
      EinstoreService.ANALYTICS,
      EinstoreService.DISTRIBUTION,
      EinstoreService.DEVICES,
      EinstoreService.USAGE,
      EinstoreService.CRASHES
    ),
    crashEnabled = true
  )
)

tracker.trackLaunchOnce()

// Capture with your existing crash handler, then enqueue for next-launch upload:
tracker.recordCrash(
  mapOf(
    "exceptionType" to "SIGABRT",
    "stackTrace" to "Thread 1 ...",
    "occurredAt" to "2024-01-01T00:00:00Z",
    "binaryHash" to "hash-of-apk"
  )
)
```

## Services
Pass the sections you want to track via `services`:
- `ANALYTICS`: app launches, sessions, screen views, custom events, user properties.
- `ERRORS`: handled exceptions that you explicitly log.
- `DISTRIBUTION`: install source and version rollout metadata.
- `DEVICES`: model, manufacturer, OS version, locale, app version.
- `USAGE`: time, time zone, session duration (country/region inferred by API).
- `CRASHES`: crash reports you enqueue for next-launch upload.
If you omit `services`, the SDK defaults to `DISTRIBUTION` and `DEVICES`.

## Notes
- Crash capture: aggregation-first; we do not install crash handlers. Use your existing crash SDK to capture and call `recordCrash`. Uploads happen on next launch when `crashEnabled` and `CRASHES` are enabled. Deobfuscation requires R8/ProGuard mapping upload.
- If you omit `baseUrl`, you can still pass full URLs via `downloadUrl` / `launchUrl` / `eventUrl`.
- `eventUrl` can override where analytics/errors events are posted (defaults to `launchUrl` or `baseUrl/tracking/events`).
- If your endpoint requires auth, pass headers in the config.
- `targetId` defaults to your application ID when not provided.
- Build resolution on the API side uses `targetId` + app version/build number, so you generally do not need to provide a build ID.
