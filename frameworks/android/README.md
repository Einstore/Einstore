# Einstore Android Tracking

Small Android library for recording app download and launch events against the Einstore API.

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
    targetId = "android-app"
  )
)

tracker.trackLaunchOnce()
```

## Notes
- `trackLaunchOnce` stores a launch marker in `SharedPreferences` to avoid duplicates.
- Point `downloadUrl` at `/builds/:id/downloads` and `launchUrl` at `/builds/:id/installs` or your own tracking endpoint.
- If your endpoint requires auth, pass headers in the config.
