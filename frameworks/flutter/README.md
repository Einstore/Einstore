# Einstore Flutter Tracking

Dart-only helper for posting download and launch events to the Einstore API.

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
    headers: {
      "Authorization": "Bearer USER_TOKEN",
      "X-Team-Id": "TEAM_ID",
    },
    deviceId: "DEVICE_ID",
  ),
);

await tracker.trackLaunchOnce();
```

## Notes
- This package uses `dart:io`, so it targets Flutter mobile/desktop apps.
- Provide a persistent `LaunchStore` (for example via `shared_preferences`) if you want launch tracking to survive app restarts.
