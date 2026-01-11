# Mobile Tracking Libraries

Use these client libraries to report download/launch activity and analytics events to the Einstore API.
Crashes are intentionally not tracked yet.

## Services
Enable only the sections you want by passing a list/array of services.

- Analytics: app launches, sessions, screen views, custom events, user properties.
- Errors: handled exceptions that you explicitly log.
- Distribution: install sources, update adoption, version rollout stats (supply fields yourself).
- Devices: model, manufacturer, OS version, locale, app version.
- Usage: country/region (IP-derived by API), time, time zone, session duration.

## Minimum Deployment Targets
These are set to the lowest currently supported defaults in the libraries.

- iOS: 12.0
- Android: minSdk 21
- Flutter: inherits iOS 12.0 / Android minSdk 21 from the host apps

## Common Configuration
All platforms share the same conceptual inputs.

- `downloadUrl`: POST endpoint for download events (ex: `/builds/:id/downloads`).
- `launchUrl`: POST endpoint for launch events (ex: `/builds/:id/installs` or iOS install track URL).
- `eventUrl`: optional override for analytics/errors events; falls back to `launchUrl`.
- `headers`: auth headers (ex: `Authorization` and `X-Team-Id`).
- `services`: list of sections to include in the payload.
- `distributionInfo`: custom fields for distribution rollout/source tracking.
- `deviceInfo`: custom device fields (model/manufacturer) when the platform cannot provide them.
- `metadata`: custom metadata merged into the payload.

## iOS (Swift Package)

### Install
1. Add the Swift package from `frameworks/ios/EinstoreTracking`.
2. Import `EinstoreTracking` in your app target.

### Example
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
    distributionInfo: ["installSource": "email"],
    targetId: "ios-app"
  )
)

tracker.trackLaunchOnce()
```

### Notes
- `trackScreenView` and `trackEvent` send analytics payloads.
- `trackError` sends handled error payloads.
- Downloads are already recorded by `/builds/:id/ios/download` if you use install links.

## Android (Gradle module)

### Install
1. Copy `frameworks/android` into your repo.
2. Add the module in `settings.gradle` and add a dependency in your app module.

### Example
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
    distributionInfo = mapOf("installSource" to "email")
  )
)

tracker.trackLaunchOnce()
```

### Notes
- Use `trackScreenView`, `trackEvent`, and `trackError` for analytics/errors.
- Provide `deviceInfo` if you need extra device details beyond model/manufacturer/OS/locale.

## Flutter (Dart)

### Install
```yaml
dependencies:
  einstore_tracking:
    path: ../frameworks/flutter
```

### Example
```dart
import 'package:einstore_tracking/einstore_tracking.dart';

final tracker = EinstoreTracker(
  EinstoreTrackingConfig(
    downloadUrl: Uri.parse("https://api.einstore.dev/builds/BUILD_ID/downloads"),
    launchUrl: Uri.parse("https://api.einstore.dev/builds/BUILD_ID/installs"),
    headers: {
      "Authorization": "Bearer USER_TOKEN",
      "X-Team-Id": "TEAM_ID",
    },
    services: const [
      EinstoreService.analytics,
      EinstoreService.distribution,
      EinstoreService.devices,
      EinstoreService.usage,
    ],
    distributionInfo: const {"installSource": "email"},
    deviceInfo: const {"model": "Pixel 8", "manufacturer": "Google"},
  ),
);

await tracker.trackLaunchOnce();
```

### Notes
- The Flutter helper does not collect device model/manufacturer automatically.
  Pass them via `deviceInfo` using a plugin like `device_info_plus`.
- `LaunchStore` can be swapped to persist launch tracking between app restarts.

## Payload Sections (at a glance)
- `analytics`: `event`, `userProperties`, `session`
- `errors`: `message`, `stackTrace`, `properties`
- `distribution`: custom fields + app version/build number
- `device`: platform defaults + custom fields
- `usage`: timestamp, locale, time zone, session duration, region (API-derived)
