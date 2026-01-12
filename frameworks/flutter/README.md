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
    baseUrl: Uri.parse("https://api.einstore.dev"), // optional, defaults to Einstore API
    headers: {
      "Authorization": "Bearer USER_TOKEN",
    },
    services: const [
      EinstoreService.analytics,
      EinstoreService.distribution,
      EinstoreService.devices,
      EinstoreService.usage,
      EinstoreService.crashes,
    ],
    crashEnabled: true,
  ),
);

await tracker.trackLaunchOnce();

// Enqueue crashes captured by your crash SDK; uploads on next launch:
await tracker.recordCrash({
  "exceptionType": "SIGABRT",
  "stackTrace": "Thread 1 ...",
  "occurredAt": DateTime.now().toUtc().toIso8601String(),
  "binaryHash": "hash-of-binary"
});
```

## Services
Pass the sections you want to track via `services`:
- `analytics`: app launches, sessions, screen views, custom events, user properties.
- `errors`: handled exceptions that you explicitly log.
- `distribution`: install source and version rollout metadata.
- `devices`: model, manufacturer, OS version, locale, app version.
- `usage`: time, time zone, session duration (country/region inferred by API).
- `crashes`: crash reports you enqueue for next-launch upload.
If you omit `services`, the helper defaults to `distribution` and `devices`.

## Notes
- Crash capture: aggregation-first; we do not install crash handlers. Use your existing crash SDK (e.g., Firebase Crashlytics) and call `recordCrash`. Uploads happen on next launch when `crashEnabled` and `crashes` are enabled. Symbolication/deobfuscation relies on iOS dSYMs and Android mapping files.
- This package uses `dart:io`, so it targets Flutter mobile/desktop apps.
- If you omit `baseUrl`, you can still pass full URLs via `downloadUrl` / `launchUrl` / `eventUrl`.
- `eventUrl` can override where analytics/errors events are posted (defaults to `baseUrl/tracking/events` or `launchUrl`).
- Provide a persistent `LaunchStore` (for example via `shared_preferences`) if you want launch tracking to survive app restarts.
- `targetId` defaults to your package name when not provided.
- Build resolution on the API side uses `targetId` + app version/build number, so you generally do not need to provide a build ID.
