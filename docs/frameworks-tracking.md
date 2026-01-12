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

- Build ID is not required. The API resolves the build using `targetId` (bundle/application id) plus the app version + build number in the payload.
- `baseUrl` (optional): Einstore API base (defaults to `https://api.einstore.dev`).
- `downloadUrl` / `launchUrl` / `eventUrl`: overrides if you need custom endpoints; otherwise only set `baseUrl` (SDKs fall back to `/tracking/events`).
- `headers`: pass the API token (`Authorization: Bearer <token>`). Team is inferred from the token.
- `services`: list of sections to include in the payload. Defaults to `distribution` and `devices` when omitted.
- `targetId` (optional): bundle id / application id. Native SDKs fill this automatically from your app; the API uses it to resolve the build.
- `distributionInfo`: custom fields for distribution rollout/source tracking.
- `deviceInfo`: custom device fields (model/manufacturer) when the platform cannot provide them.
- `metadata`: custom metadata merged into the payload.
- Build resolution: the API derives the build from `targetId` plus build number/version in the payload. Provide an explicit `downloadUrl`/`launchUrl` only if you need a different endpoint.
- Crashes: enable `crashes` service + `crashEnabled` in the SDK and enqueue crashes with `recordCrash`. Uploads occur on next launch. Do not install competing crash handlers; reuse your existing crash SDK to capture.

## iOS (Swift Package)

### Install
1. Add the Swift package from `frameworks/ios/EinstoreTracking`.
2. Import `EinstoreTracking` in your app target.

### Example
```swift
import EinstoreTracking

let tracker = EinstoreTracker(
  config: EinstoreTrackingConfig(
    baseUrl: URL(string: "https://api.einstore.dev"), // optional
    headers: [
      "Authorization": "Bearer API_TOKEN"
    ],
    services: [.analytics, .distribution, .devices, .usage], // defaults to distribution + devices if omitted
    distributionInfo: ["installSource": "email"]
  )
)

tracker.trackLaunchOnce()
```

### Notes
- `trackScreenView` and `trackEvent` send analytics payloads.
- `trackError` sends handled error payloads.
- Downloads are already recorded by `/builds/:id/ios/download` if you use install links.
- The SDK fills `targetId` from your bundle identifier; override only if needed.

## Android (Gradle module)

### Install
1. Copy `frameworks/android` into your repo.
2. Add the module in `settings.gradle` and add a dependency in your app module.

### Example
```kotlin
val tracker = EinstoreTracker(
  context = applicationContext,
  config = EinstoreTrackingConfig(
    baseUrl = "https://api.einstore.dev", // optional
    headers = mapOf(
      "Authorization" to "Bearer API_TOKEN"
    ),
    services = setOf(
      EinstoreService.ANALYTICS,
      EinstoreService.DISTRIBUTION,
      EinstoreService.DEVICES,
      EinstoreService.USAGE
    ), // defaults to distribution + devices when omitted
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
    baseUrl: Uri.parse("https://api.einstore.dev"), // optional
    headers: {
      "Authorization": "Bearer API_TOKEN",
    },
    services: const [
      EinstoreService.analytics,
      EinstoreService.distribution,
      EinstoreService.devices,
      EinstoreService.usage,
    ], // defaults to distribution + devices when omitted
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
- `crashes`: crash payloads you enqueue for next-launch upload (exception/signal, stack, threads, breadcrumbs, build identity, binary hash, environment, install source)

## Crash reporting (brief)
- Capture mode: Aggregation-first. Do not install your own crash handlers if another SDK (Crashlytics/Sentry/AppCenter) is present. Upload crashes on next launch only.
- Build identity: app_id (bundle/application id) + platform + version_name + version_code + environment, with binary_hash fallback (and signing cert hash as a further bucket). Server resolves builds; clients never send DB IDs.
- Payload shape (to be added in future SDKs): crash time, launch time, foreground flag, exception/signal, stacks (symbolicated), threads, device/OS, last screen/route, breadcrumbs, feature flags/experiments, network type, memory/ANR markers; PII excluded by default.
- Symbolication: dSYMs (iOS) and R8/ProGuard mapping (Android) must be uploaded per release build; treat missing files as pipeline failures.
- Flutter: use `firebase_crashlytics` and attach build identity as custom keys (app_id, platform, version_name, version_code, environment, binary_hash if available via platform channel). Crash capture remains disabled in our SDKs until exclusivity rules are finalized.
