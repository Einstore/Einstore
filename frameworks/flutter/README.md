# Einstore Flutter Tracking

Dart helper for posting download, launch, analytics, and error events to the Einstore API.

## Install
```yaml
dependencies:
  einstore_tracking:
    path: ../frameworks/flutter
```

## Usage
```dart
import 'package:einstore_tracking/einstore_tracking.dart';

final tracker = EinstoreTracker(
  EinstoreTrackingConfig(
    downloadUrl: Uri.parse("https://api.einstore.dev/builds/BUILD_ID/downloads"),
    launchUrl: Uri.parse("https://api.einstore.dev/builds/BUILD_ID/installs"),
    eventUrl: Uri.parse("https://api.einstore.dev/builds/BUILD_ID/events"),
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
  ),
);

await tracker.trackLaunchOnce();
```

## Services
Pass the sections you want to track via `services`:
- `analytics`: app launches, sessions, screen views, custom events, user properties.
- `errors`: handled exceptions that you explicitly log.
- `distribution`: install source and version rollout metadata.
- `devices`: model, manufacturer, OS version, locale, app version.
- `usage`: time, time zone, session duration (country/region inferred by API).

## Notes
- Crashes are not tracked yet.
- This package uses `dart:io`, so it targets Flutter mobile/desktop apps.
- `eventUrl` can override where analytics/errors events are posted (defaults to `launchUrl`).
- Provide a persistent `LaunchStore` (for example via `shared_preferences`) if you want launch tracking to survive app restarts.
