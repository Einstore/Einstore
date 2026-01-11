export type InfoPlistKey = { key: string; description: string };

export const infoPlistKeyGroups: { title: string; items: InfoPlistKey[] }[] = [
  {
    title: "App Identity & Metadata",
    items: [
      { key: "CFBundleIdentifier", description: "Unique reverse-DNS identifier for the app." },
      { key: "CFBundleName", description: "Short displayable name of the app." },
      { key: "CFBundleDisplayName", description: "Name shown under the app icon on the Home Screen." },
      { key: "CFBundleExecutable", description: "Name of the app’s main executable." },
      { key: "CFBundleShortVersionString", description: "User-facing version number (e.g. 1.2.3)." },
      { key: "CFBundleVersion", description: "Internal build number." },
      { key: "CFBundlePackageType", description: "Package type, usually APPL." },
      { key: "CFBundleSignature", description: "Legacy four-character creator code (mostly unused)." },
      { key: "LSApplicationCategoryType", description: "App Store category identifier." },
    ],
  },
  {
    title: "Icons & Launch",
    items: [
      { key: "CFBundleIcons", description: "Icon definitions for iPhone and iPad." },
      { key: "CFBundleIcons~ipad", description: "iPad-specific icon definitions." },
      { key: "UILaunchStoryboardName", description: "Launch screen storyboard file." },
      { key: "UILaunchScreen", description: "Dictionary-based launch screen configuration." },
      { key: "UIPrerenderedIcon", description: "Indicates icon is already gloss-free (legacy)." },
    ],
  },
  {
    title: "Scene & Lifecycle",
    items: [
      { key: "UIApplicationSceneManifest", description: "Scene configuration for multi-window support." },
      { key: "UIApplicationSupportsMultipleScenes", description: "Enables multiple scenes on iPadOS." },
      { key: "UISceneConfigurations", description: "Scene role and delegate mappings." },
    ],
  },
  {
    title: "Orientation & UI Behavior",
    items: [
      { key: "UISupportedInterfaceOrientations", description: "Allowed interface orientations (iPhone)." },
      {
        key: "UISupportedInterfaceOrientations~ipad",
        description: "Allowed interface orientations for iPad.",
      },
      { key: "UIRequiresFullScreen", description: "Forces full-screen mode on iPad." },
      {
        key: "UIViewControllerBasedStatusBarAppearance",
        description: "Per-view-controller status bar control.",
      },
      { key: "UIStatusBarHidden", description: "Hides the status bar globally." },
      { key: "UIStatusBarStyle", description: "Default status bar style." },
      { key: "UIUserInterfaceStyle", description: "Light, Dark, or Automatic appearance." },
      { key: "UIRequiresPersistentWiFi", description: "Requests continuous Wi‑Fi connection." },
    ],
  },
  {
    title: "Permissions (Privacy)",
    items: [
      { key: "NSCameraUsageDescription", description: "Reason for camera access." },
      { key: "NSMicrophoneUsageDescription", description: "Reason for microphone access." },
      { key: "NSPhotoLibraryUsageDescription", description: "Reason for photo library read access." },
      { key: "NSPhotoLibraryAddUsageDescription", description: "Reason for photo library write access." },
      { key: "NSLocationWhenInUseUsageDescription", description: "Reason for location while active." },
      { key: "NSLocationAlwaysUsageDescription", description: "Reason for continuous location access." },
      {
        key: "NSLocationAlwaysAndWhenInUseUsageDescription",
        description: "Combined location explanation.",
      },
      { key: "NSContactsUsageDescription", description: "Reason for contacts access." },
      { key: "NSCalendarsUsageDescription", description: "Reason for calendar access." },
      { key: "NSRemindersUsageDescription", description: "Reason for reminders access." },
      { key: "NSBluetoothAlwaysUsageDescription", description: "Reason for Bluetooth access." },
      { key: "NSBluetoothPeripheralUsageDescription", description: "Legacy Bluetooth usage description." },
      { key: "NSMotionUsageDescription", description: "Reason for motion sensor access." },
      { key: "NSHealthShareUsageDescription", description: "Reason for reading Health data." },
      { key: "NSHealthUpdateUsageDescription", description: "Reason for writing Health data." },
      { key: "NSFaceIDUsageDescription", description: "Reason for Face ID authentication." },
      { key: "NSLocalNetworkUsageDescription", description: "Reason for local network discovery." },
      {
        key: "NSUserTrackingUsageDescription",
        description: "Reason for App Tracking Transparency request.",
      },
    ],
  },
  {
    title: "Networking & Security",
    items: [
      { key: "NSAppTransportSecurity", description: "App Transport Security configuration." },
      { key: "NSAllowsArbitraryLoads", description: "Allows insecure HTTP connections." },
      { key: "NSAllowsArbitraryLoadsInWebContent", description: "Allows HTTP in web views." },
      { key: "NSExceptionDomains", description: "Per-domain ATS exceptions." },
      { key: "UIBackgroundModes", description: "Declares background execution capabilities." },
    ],
  },
  {
    title: "Background Modes",
    items: [
      { key: "audio", description: "Enables background audio playback." },
      { key: "location", description: "Enables background location updates." },
      { key: "voip", description: "Enables VoIP background execution." },
      { key: "fetch", description: "Enables background fetch." },
      { key: "processing", description: "Enables long-running background tasks." },
      { key: "remote-notification", description: "Enables silent push notifications." },
      { key: "bluetooth-central", description: "Enables Bluetooth central background use." },
      { key: "bluetooth-peripheral", description: "Enables Bluetooth peripheral background use." },
    ],
  },
  {
    title: "App Capabilities",
    items: [
      { key: "UIFileSharingEnabled", description: "Enables file access via Finder/iTunes." },
      {
        key: "LSSupportsOpeningDocumentsInPlace",
        description: "Enables in-place document editing.",
      },
      { key: "UISupportsDocumentBrowser", description: "Enables document browser UI." },
      { key: "UIBackgroundFetchIntervalMinimum", description: "Minimum fetch interval hint." },
      {
        key: "UIApplicationExitsOnSuspend",
        description: "Forces app termination on backgrounding (not recommended).",
      },
    ],
  },
  {
    title: "URL Handling & Deep Linking",
    items: [
      { key: "CFBundleURLTypes", description: "Declares custom URL schemes." },
      { key: "CFBundleURLSchemes", description: "URL schemes the app can open." },
      { key: "LSApplicationQueriesSchemes", description: "URL schemes the app can query." },
      { key: "NSUserActivityTypes", description: "Declares supported user activity types." },
      { key: "CFBundleDocumentTypes", description: "Supported document types." },
      { key: "UTExportedTypeDeclarations", description: "Custom exported UTTypes." },
      { key: "UTImportedTypeDeclarations", description: "Imported UTTypes from other apps." },
    ],
  },
  {
    title: "Fonts & Resources",
    items: [
      { key: "UIAppFonts", description: "Bundled custom fonts." },
      { key: "CFBundleDevelopmentRegion", description: "Default localization region." },
      { key: "CFBundleLocalizations", description: "Supported localizations." },
    ],
  },
  {
    title: "Extensions & App Groups",
    items: [
      { key: "NSExtension", description: "Configuration for app extensions." },
      { key: "NSExtensionPointIdentifier", description: "Extension type identifier." },
      { key: "NSExtensionAttributes", description: "Extension-specific capabilities." },
      { key: "AppGroupIdentifier", description: "Shared container identifier (capability-backed)." },
    ],
  },
  {
    title: "System Integration",
    items: [
      { key: "UIRequiredDeviceCapabilities", description: "Hardware features required to run." },
      { key: "UIDeviceFamily", description: "Supported device families (iPhone, iPad)." },
      { key: "UIIndirectInputEventsSupported", description: "Supports indirect input (trackpad/mouse)." },
      { key: "UISupportsPencilOnlyDrawing", description: "Restricts drawing to Apple Pencil." },
    ],
  },
  {
    title: "Store & Compliance",
    items: [
      { key: "ITSAppUsesNonExemptEncryption", description: "Declares encryption usage for export compliance." },
      { key: "LSRequiresIPhoneOS", description: "Indicates iOS-only app." },
      { key: "UIApplicationSupportsIndirectInputEvents", description: "Enables keyboard/mouse support." },
    ],
  },
  {
    title: "Debug / Legacy / Rare",
    items: [
      { key: "UIViewEdgeAntialiasing", description: "Enables edge antialiasing." },
      { key: "UIHighResolutionCapable", description: "Enables Retina rendering (legacy)." },
      { key: "CFBundleInfoDictionaryVersion", description: "Info.plist format version." },
    ],
  },
];

export const infoPlistKeyDescriptionMap: Record<string, string> = infoPlistKeyGroups.reduce(
  (acc, group) => {
    group.items.forEach((item) => {
      acc[item.key] = item.description;
    });
    return acc;
  },
  {} as Record<string, string>
);
