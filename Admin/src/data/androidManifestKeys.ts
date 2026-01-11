export type AndroidManifestKey = { key: string; description: string };

export const androidManifestKeyGroups: { title: string; items: AndroidManifestKey[] }[] = [
  {
    title: "Root <manifest>",
    items: [
      { key: "package", description: "Unique application ID used by Android and Play Store." },
      { key: "android:versionCode", description: "Internal version number for updates." },
      { key: "android:versionName", description: "User-visible version string." },
      {
        key: "android:installLocation",
        description: "Preferred install location (internal, auto, preferExternal).",
      },
    ],
  },
  {
    title: "SDK & Compatibility",
    items: [
      { key: "<uses-sdk>", description: "Declares SDK compatibility." },
      { key: "android:minSdkVersion", description: "Minimum Android version supported." },
      { key: "android:targetSdkVersion", description: "Android version app is optimized for." },
      { key: "android:maxSdkVersion", description: "Maximum SDK supported (rarely used)." },
    ],
  },
  {
    title: "Application <application>",
    items: [
      { key: "android:name", description: "Custom Application class." },
      { key: "android:label", description: "App display name." },
      { key: "android:icon", description: "App launcher icon." },
      { key: "android:roundIcon", description: "Round launcher icon." },
      { key: "android:theme", description: "Default app theme." },
      { key: "android:allowBackup", description: "Enables system app data backup." },
      { key: "android:fullBackupContent", description: "Backup rules XML." },
      { key: "android:dataExtractionRules", description: "Android 12+ backup/restore rules." },
      { key: "android:debuggable", description: "Enables debugging (false for release)." },
      { key: "android:usesCleartextTraffic", description: "Allows HTTP traffic." },
      { key: "android:networkSecurityConfig", description: "Custom network security rules." },
      { key: "android:supportsRtl", description: "Enables right-to-left layouts." },
      { key: "android:resizeableActivity", description: "Enables multi-window support." },
      { key: "android:largeHeap", description: "Requests larger Dalvik/ART heap." },
      { key: "android:hardwareAccelerated", description: "Enables GPU acceleration." },
      { key: "android:localeConfig", description: "Declares supported app locales." },
      { key: "android:appCategory", description: "Play Store app category hint." },
    ],
  },
  {
    title: "Activities <activity>",
    items: [
      { key: "android:name", description: "Activity class name." },
      { key: "android:exported", description: "Whether activity is accessible externally." },
      { key: "android:launchMode", description: "How activity is instantiated (standard, singleTop, etc)." },
      { key: "android:taskAffinity", description: "Task association behavior." },
      { key: "android:screenOrientation", description: "Fixed orientation behavior." },
      { key: "android:configChanges", description: "Configuration changes handled manually." },
      { key: "android:windowSoftInputMode", description: "Keyboard interaction behavior." },
      { key: "android:theme", description: "Activity-specific theme." },
      { key: "android:excludeFromRecents", description: "Hides activity from recent apps." },
      { key: "android:permission", description: "Permission required to launch activity." },
    ],
  },
  {
    title: "Intents & Deep Linking <intent-filter>",
    items: [
      { key: "<action>", description: "Declares supported actions." },
      { key: "<category>", description: "Declares activity category." },
      { key: "<data>", description: "URI scheme, host, path, or MIME type matching." },
      { key: "android:autoVerify", description: "Enables Android App Links verification." },
    ],
  },
  {
    title: "Services <service>",
    items: [
      { key: "android:name", description: "Service class name." },
      { key: "android:exported", description: "Whether service is externally accessible." },
      { key: "android:foregroundServiceType", description: "Declares foreground service purpose." },
      { key: "android:permission", description: "Permission required to bind/start service." },
      { key: "android:enabled", description: "Enables or disables service." },
    ],
  },
  {
    title: "Broadcast Receivers <receiver>",
    items: [
      { key: "android:name", description: "Receiver class name." },
      { key: "android:exported", description: "Whether broadcasts can come from outside." },
      { key: "android:permission", description: "Permission required to send broadcasts." },
      { key: "android:enabled", description: "Enables or disables receiver." },
    ],
  },
  {
    title: "Content Providers <provider>",
    items: [
      { key: "android:name", description: "Provider class name." },
      { key: "android:authorities", description: "Unique content URI authority." },
      { key: "android:exported", description: "External accessibility." },
      { key: "android:grantUriPermissions", description: "Allows temporary URI access." },
      { key: "android:readPermission", description: "Permission required to read data." },
      { key: "android:writePermission", description: "Permission required to modify data." },
    ],
  },
  {
    title: "Permissions",
    items: [
      { key: "<uses-permission>", description: "Declares required permission." },
      { key: "android:name", description: "Permission identifier." },
      { key: "android:maxSdkVersion", description: "Limits permission to older SDKs." },
      { key: "<permission>", description: "Declares a custom app permission." },
      { key: "android:protectionLevel", description: "Permission security level." },
    ],
  },
  {
    title: "Features & Hardware",
    items: [
      { key: "<uses-feature>", description: "Declares required or optional hardware/software feature." },
      { key: "android:required", description: "Whether feature is mandatory." },
      { key: "android:name", description: "Feature identifier (e.g. camera, NFC)." },
    ],
  },
  {
    title: "Queries (Android 11+)",
    items: [
      { key: "<queries>", description: "Declares packages, intents, or providers the app can query." },
      { key: "<package>", description: "Explicit package visibility." },
      { key: "<intent>", description: "Intent-based visibility declaration." },
      { key: "<provider>", description: "Provider visibility declaration." },
    ],
  },
  {
    title: "Metadata",
    items: [
      { key: "<meta-data>", description: "Arbitrary key-value metadata." },
      { key: "android:name", description: "Metadata key." },
      { key: "android:value", description: "Inline metadata value." },
      { key: "android:resource", description: "Resource-based metadata value." },
    ],
  },
  {
    title: "App Shortcuts & Navigation",
    items: [
      { key: "android.support.PARENT_ACTIVITY", description: "Defines parent activity for navigation." },
      { key: "android:taskAffinity", description: "Controls back stack grouping." },
    ],
  },
  {
    title: "Instant Apps / Play Features",
    items: [
      { key: "android:dist:onDemand", description: "Dynamic feature module on-demand flag." },
      { key: "android:dist:fusing", description: "Whether module is included in base APK." },
      { key: "android:dist:title", description: "Feature title for Play Store." },
    ],
  },
  {
    title: "TV / Auto / Wear",
    items: [
      { key: "android.intent.category.LEANBACK_LAUNCHER", description: "Android TV launcher support." },
      { key: "android.hardware.type.watch", description: "Wear OS device support." },
      { key: "android.hardware.type.automotive", description: "Android Auto support." },
    ],
  },
  {
    title: "Testing & Tooling",
    items: [
      { key: "tools:replace", description: "Overrides manifest attributes at merge time." },
      { key: "tools:node", description: "Controls manifest merge behavior." },
      { key: "tools:ignore", description: "Suppresses Lint warnings." },
    ],
  },
  {
    title: "Legacy / Rare",
    items: [
      { key: "android:persistent", description: "Requests system persistence (system apps only)." },
      { key: "android:sharedUserId", description: "Shares UID with other apps (deprecated)." },
      { key: "android:vmSafeMode", description: "Runs Dalvik in safe mode (obsolete)." },
    ],
  },
];

export const androidManifestKeyDescriptionMap: Record<string, string> =
  androidManifestKeyGroups.reduce((acc, group) => {
    group.items.forEach((item) => {
      acc[item.key] = item.description;
    });
    return acc;
  }, {} as Record<string, string>);
