# Android Manifest Key Reference

## Root `<manifest>`
- package — Unique application ID used by Android and Play Store.
- android:versionCode — Internal version number for updates.
- android:versionName — User-visible version string.
- android:installLocation — Preferred install location (internal, auto, preferExternal).

## SDK & Compatibility
- `<uses-sdk>` — Declares SDK compatibility.
- android:minSdkVersion — Minimum Android version supported.
- android:targetSdkVersion — Android version app is optimized for.
- android:maxSdkVersion — Maximum SDK supported (rarely used).

## Application `<application>`
- android:name — Custom Application class.
- android:label — App display name.
- android:icon — App launcher icon.
- android:roundIcon — Round launcher icon.
- android:theme — Default app theme.
- android:allowBackup — Enables system app data backup.
- android:fullBackupContent — Backup rules XML.
- android:dataExtractionRules — Android 12+ backup/restore rules.
- android:debuggable — Enables debugging (false for release).
- android:usesCleartextTraffic — Allows HTTP traffic.
- android:networkSecurityConfig — Custom network security rules.
- android:supportsRtl — Enables right-to-left layouts.
- android:resizeableActivity — Enables multi-window support.
- android:largeHeap — Requests larger Dalvik/ART heap.
- android:hardwareAccelerated — Enables GPU acceleration.
- android:localeConfig — Declares supported app locales.
- android:appCategory — Play Store app category hint.

## Activities `<activity>`
- android:name — Activity class name.
- android:exported — Whether activity is accessible externally.
- android:launchMode — How activity is instantiated (standard, singleTop, etc).
- android:taskAffinity — Task association behavior.
- android:screenOrientation — Fixed orientation behavior.
- android:configChanges — Configuration changes handled manually.
- android:windowSoftInputMode — Keyboard interaction behavior.
- android:theme — Activity-specific theme.
- android:excludeFromRecents — Hides activity from recent apps.
- android:permission — Permission required to launch activity.

## Intents & Deep Linking `<intent-filter>`
- `<action>` — Declares supported actions.
- `<category>` — Declares activity category.
- `<data>` — URI scheme, host, path, or MIME type matching.
- android:autoVerify — Enables Android App Links verification.

## Services `<service>`
- android:name — Service class name.
- android:exported — Whether service is externally accessible.
- android:foregroundServiceType — Declares foreground service purpose.
- android:permission — Permission required to bind/start service.
- android:enabled — Enables or disables service.

## Broadcast Receivers `<receiver>`
- android:name — Receiver class name.
- android:exported — Whether broadcasts can come from outside.
- android:permission — Permission required to send broadcasts.
- android:enabled — Enables or disables receiver.

## Content Providers `<provider>`
- android:name — Provider class name.
- android:authorities — Unique content URI authority.
- android:exported — External accessibility.
- android:grantUriPermissions — Allows temporary URI access.
- android:readPermission — Permission required to read data.
- android:writePermission — Permission required to modify data.

## Permissions
- `<uses-permission>` — Declares required permission.
- android:name — Permission identifier.
- android:maxSdkVersion — Limits permission to older SDKs.
- `<permission>` — Declares a custom app permission.
- android:protectionLevel — Permission security level.

## Features & Hardware
- `<uses-feature>` — Declares required or optional hardware/software feature.
- android:required — Whether feature is mandatory.
- android:name — Feature identifier (e.g. camera, NFC).

## Queries (Android 11+)
- `<queries>` — Declares packages, intents, or providers the app can query.
- `<package>` — Explicit package visibility.
- `<intent>` — Intent-based visibility declaration.
- `<provider>` — Provider visibility declaration.

## Metadata
- `<meta-data>` — Arbitrary key-value metadata.
- android:name — Metadata key.
- android:value — Inline metadata value.
- android:resource — Resource-based metadata value.

## App Shortcuts & Navigation
- android.support.PARENT_ACTIVITY — Defines parent activity for navigation.
- android:taskAffinity — Controls back stack grouping.

## Instant Apps / Play Features
- android:dist:onDemand — Dynamic feature module on-demand flag.
- android:dist:fusing — Whether module is included in base APK.
- android:dist:title — Feature title for Play Store.

## TV / Auto / Wear
- android.intent.category.LEANBACK_LAUNCHER — Android TV launcher support.
- android.hardware.type.watch — Wear OS device support.
- android.hardware.type.automotive — Android Auto support.

## Testing & Tooling
- tools:replace — Overrides manifest attributes at merge time.
- tools:node — Controls manifest merge behavior.
- tools:ignore — Suppresses Lint warnings.

## Legacy / Rare
- android:persistent — Requests system persistence (system apps only).
- android:sharedUserId — Shares UID with other apps (deprecated).
- android:vmSafeMode — Runs Dalvik in safe mode (obsolete).
