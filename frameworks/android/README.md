# Einstore Android Tracking

Android library for recording app downloads, launches, and analytics events against the Einstore API.

## Install
- Copy `frameworks/android` into your repo and include it as a Gradle module.

## Usage
```kotlin
val tracker = EinstoreTracker(
  context = applicationContext,
  config = EinstoreTrackingConfig(
    downloadUrl = "https://api.einstore.dev/builds/BUILD_ID/downloads",
    launchUrl = "https://api.einstore.dev/builds/BUILD_ID/installs",
    headers = mapOf(
      "Authorization" to "Bearer USER_TOKEN",
      "X-Team-Id" to "TEAM_ID"
    ),
    services = setOf(
      EinstoreService.ANALYTICS,
      EinstoreService.DISTRIBUTION,
      EinstoreService.DEVICES,
      EinstoreService.USAGE
    ),
    targetId = "android-app"
  )
)

tracker.trackLaunchOnce()
```

## Services
Pass the sections you want to track via `services`:
- `ANALYTICS`: app launches, sessions, screen views, custom events, user properties.
- `ERRORS`: handled exceptions that you explicitly log.
- `DISTRIBUTION`: install source and version rollout metadata.
- `DEVICES`: model, manufacturer, OS version, locale, app version.
- `USAGE`: time, time zone, session duration (country/region inferred by API).

## Notes
- Crashes are not tracked yet.
- `eventUrl` can override where analytics/errors events are posted (defaults to `launchUrl`).
- If your endpoint requires auth, pass headers in the config.
