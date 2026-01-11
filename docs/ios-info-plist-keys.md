# iOS Info.plist Key Reference

## App Identity & Metadata
- CFBundleIdentifier — Unique reverse-DNS identifier for the app.
- CFBundleName — Short displayable name of the app.
- CFBundleDisplayName — Name shown under the app icon on the Home Screen.
- CFBundleExecutable — Name of the app’s main executable.
- CFBundleShortVersionString — User-facing version number (e.g. 1.2.3).
- CFBundleVersion — Internal build number.
- CFBundlePackageType — Package type, usually APPL.
- CFBundleSignature — Legacy four-character creator code (mostly unused).
- LSApplicationCategoryType — App Store category identifier.

## Icons & Launch
- CFBundleIcons — Icon definitions for iPhone and iPad.
- CFBundleIcons~ipad — iPad-specific icon definitions.
- UILaunchStoryboardName — Launch screen storyboard file.
- UILaunchScreen — Dictionary-based launch screen configuration.
- UIPrerenderedIcon — Indicates icon is already gloss-free (legacy).

## Scene & Lifecycle
- UIApplicationSceneManifest — Scene configuration for multi-window support.
- UIApplicationSupportsMultipleScenes — Enables multiple scenes on iPadOS.
- UISceneConfigurations — Scene role and delegate mappings.

## Orientation & UI Behavior
- UISupportedInterfaceOrientations — Allowed interface orientations (iPhone).
- UISupportedInterfaceOrientations~ipad — Allowed orientations for iPad.
- UIRequiresFullScreen — Forces full-screen mode on iPad.
- UIViewControllerBasedStatusBarAppearance — Per-VC status bar control.
- UIStatusBarHidden — Hides the status bar globally.
- UIStatusBarStyle — Default status bar style.
- UIUserInterfaceStyle — Light, Dark, or Automatic appearance.
- UIRequiresPersistentWiFi — Requests continuous Wi-Fi connection (rare).

## Permissions (Privacy)
- NSCameraUsageDescription — Reason for camera access.
- NSMicrophoneUsageDescription — Reason for microphone access.
- NSPhotoLibraryUsageDescription — Reason for photo library read access.
- NSPhotoLibraryAddUsageDescription — Reason for photo library write access.
- NSLocationWhenInUseUsageDescription — Reason for location while app is active.
- NSLocationAlwaysUsageDescription — Reason for continuous location access.
- NSLocationAlwaysAndWhenInUseUsageDescription — Combined location explanation.
- NSContactsUsageDescription — Reason for contacts access.
- NSCalendarsUsageDescription — Reason for calendar access.
- NSRemindersUsageDescription — Reason for reminders access.
- NSBluetoothAlwaysUsageDescription — Reason for Bluetooth access.
- NSBluetoothPeripheralUsageDescription — Legacy Bluetooth usage description.
- NSMotionUsageDescription — Reason for motion sensor access.
- NSHealthShareUsageDescription — Reason for reading Health data.
- NSHealthUpdateUsageDescription — Reason for writing Health data.
- NSFaceIDUsageDescription — Reason for Face ID authentication.
- NSLocalNetworkUsageDescription — Reason for local network discovery.
- NSUserTrackingUsageDescription — Reason for App Tracking Transparency request.

## Networking & Security
- NSAppTransportSecurity — App Transport Security configuration.
- NSAllowsArbitraryLoads — Allows insecure HTTP connections.
- NSAllowsArbitraryLoadsInWebContent — Allows HTTP in web views.
- NSExceptionDomains — Per-domain ATS exceptions.
- UIBackgroundModes — Declares background execution capabilities.

## Background Modes
- audio — Enables background audio playback.
- location — Enables background location updates.
- voip — Enables VoIP background execution.
- fetch — Enables background fetch.
- processing — Enables long-running background tasks.
- remote-notification — Enables silent push notifications.
- bluetooth-central — Enables Bluetooth central background use.
- bluetooth-peripheral — Enables Bluetooth peripheral background use.

## App Capabilities
- UIFileSharingEnabled — Enables file access via Finder/iTunes.
- LSSupportsOpeningDocumentsInPlace — Enables in-place document editing.
- UISupportsDocumentBrowser — Enables document browser UI.
- UIBackgroundFetchIntervalMinimum — Minimum fetch interval hint.
- UIApplicationExitsOnSuspend — Forces app termination on backgrounding (not recommended).

## URL Handling & Deep Linking
- CFBundleURLTypes — Declares custom URL schemes.
- CFBundleURLSchemes — URL schemes the app can open.
- LSApplicationQueriesSchemes — URL schemes the app can query.
- NSUserActivityTypes — Declares supported user activity types.
- CFBundleDocumentTypes — Supported document types.
- UTExportedTypeDeclarations — Custom exported UTTypes.
- UTImportedTypeDeclarations — Imported UTTypes from other apps.

## Fonts & Resources
- UIAppFonts — Bundled custom fonts.
- CFBundleDevelopmentRegion — Default localization region.
- CFBundleLocalizations — Supported localizations.

## Extensions & App Groups
- NSExtension — Configuration for app extensions.
- NSExtensionPointIdentifier — Extension type identifier.
- NSExtensionAttributes — Extension-specific capabilities.
- AppGroupIdentifier — Shared container identifier (capability-backed).

## System Integration
- UIRequiredDeviceCapabilities — Hardware features required to run.
- UIDeviceFamily — Supported device families (iPhone, iPad).
- UIIndirectInputEventsSupported — Supports indirect input (trackpad/mouse).
- UISupportsPencilOnlyDrawing — Restricts drawing to Apple Pencil.

## Store & Compliance
- ITSAppUsesNonExemptEncryption — Declares encryption usage for export compliance.
- LSRequiresIPhoneOS — Indicates iOS-only app.
- UIApplicationSupportsIndirectInputEvents — Enables keyboard/mouse support.

## Debug / Legacy / Rare
- UIViewEdgeAntialiasing — Enables edge antialiasing.
- UIHighResolutionCapable — Enables Retina rendering (legacy).
- CFBundleInfoDictionaryVersion — Info.plist format version.
