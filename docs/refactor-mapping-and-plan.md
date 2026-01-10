# Einstore Refactor Mapping + Plan

## Purpose
Ground-up refactor of the legacy Einstore system into a modern, compliant private mobile app distribution platform for iOS and Android. Legacy code remains reference-only.

## Constraints (Non-Negotiable)
- No legacy backend/admin code reuse beyond reference.
- New architecture must model: App -> Version -> Build -> Targets/Variants/etc.
- Device-aware installation resolver is required (no direct "download build").
- Platforms must be data-driven (no hardcoded iOS vs Android logic).
- Auth must use rafiki/auth as an external contract (submodule).
- Monorepo only (no separate internal modules aside from auth submodule).
- Storage must support local filesystem or S3 (self-hosted).
- Extraction and processing run in a DigitalOcean Function; results are returned to the API.
- Images and binaries are uploaded directly to DigitalOcean Spaces from the Function.

## Repo Setup (Target State)
```
/API    (Node.js + Fastify + Prisma + PostgreSQL + rafiki270/auth + Zod)
/Web    (React + Tailwind, CSR)
/Admin  (React + Tailwind, CSR, redesigned)
/dev    (gitignored legacy reference)
/Libraries (external submodules, auth only)
```

## Legacy Inventory (Reference)

### Legacy Repos (Local Reference)
- dev/Einstore/EinstoreCore
- dev/Einstore/EinstoreAdmin
- dev/Einstore/Einstore
- dev/Einstore/HTTPMediaTypes
- dev/LiveUI/ApiCore
- dev/LiveUI/Boost
- dev/LiveUI/BoostCore
- dev/LiveUI/ErrorsCore
- dev/LiveUI/FluentTestTools
- dev/LiveUI/MailCore
- dev/LiveUI/S3
- dev/LiveUI/VaporTestTools
- dev/LiveUI/XMLCoding
- dev/vapor-community/Imperial

### Legacy Build/Asset Extraction Behavior (Must Preserve Behavior)

#### IPA (iOS) extraction
Path: dev/Einstore/EinstoreCore/Sources/EinstoreCore/Libs/Extractor/Ipa/Ipa.swift
- Unzips IPA -> Payload/<App>.app
- Reads Info.plist
- Extracts:
  - CFBundleIdentifier (bundle id)
  - CFBundleDisplayName / CFBundleName (app name)
  - CFBundleShortVersionString, CFBundleVersion
  - MinimumOSVersion, orientations, device capabilities, device family
- Reads embedded.mobileprovision as text and classifies provisioning:
  - enterprise (ProvisionsAllDevices)
  - adhoc (ProvisionedDevices)
  - appstore (default)
- Icon extraction:
  - Reads CFBundleIcons + CFBundleIcons~ipad
  - Chooses largest icon by byte size
  - Normalizes PNG via Normalized

#### APK (Android) extraction
Path: dev/Einstore/EinstoreCore/Sources/EinstoreCore/Libs/Extractor/Apk/Apk.swift
- Uses aapt dump badging to extract:
  - package name, versionName, versionCode
  - sdkVersion, targetSdkVersion
  - permissions, features, locales, native code
  - app label and density icons
- Uses aapt dump resources + grep to locate icon path
- Unzips icon file and chooses largest by byte size

### Legacy Endpoints (Postman Inventory)
Source: Einstore.postman_collection.json
Format: METHOD  PATH  (Name)

- OPTIONS  {{SERVER}}ping  (CORS)
- GET  {{SERVER}}install  (Install)
- GET  {{SERVER}}demo  (Demo)
- GET  {{SERVER}}uninstall  (Uninstall)
- POST  {{SERVER}}auth/recovery  (Recovery)
- POST  {{SERVER}}auth/recovery/finish?token={{RECOVERY_TOKEN}}  (Recovery finish)
- POST  {{SERVER}}auth/password-check  (Password check)
- GET  {{SERVER}}auth  (Auth BASIC)
- GET  {{SERVER}}auth/github/login?link=this_has_been_success  (Auth Github)
- GET  {{SERVER}}auth/gitlab/login?link=this_has_been_success  (Auth Gitlab)
- POST  {{SERVER}}auth  (Auth)
- GET  {{SERVER}}authenticators  (Authenticators)
- GET  {{SERVER}}token  (JWT refresh)
- POST  {{SERVER}}token  (JWT refresh)
- GET  {{SERVER}}logout/all  (Logout)
- POST  {{SERVER}}logout/all  (Logout)
- POST  {{SERVER}}teams/check  (Teams check)
- POST  {{SERVER}}teams  (Teams create)
- GET  {{SERVER}}teams  (Teams list)
- POST  {{SERVER}}teams/{{TEST_TEAM_ID}}/icon  (Team icon upload)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}  (Team detail)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/icon  (Team icon)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/favicon  (Team favicon)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/icon/16  (Team icon 16)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/icon/64  (Team icon 64)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/icon/128  (Team icon 128)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/icon/192  (Team icon 192)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/icon/256  (Team icon 256)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/icon/512  (Team icon 512)
- DELETE  {{SERVER}}teams/{{TEST_TEAM_ID}}/icon  (Team icon delete)
- POST  {{SERVER}}teams/{{TEST_TEAM_ID}}/link  (Team link)
- POST  {{SERVER}}teams/{{TEST_TEAM_ID}}/unlink  (Team unlink)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/users  (Team users)
- PUT  {{SERVER}}teams/{{TEST_TEAM_ID}}  (Team update)
- DELETE  {{SERVER}}teams/{{TEST_TEAM_ID}}  (Team delete)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/config  (Team config)
- POST  {{SERVER}}teams/{{TEST_TEAM_ID}}/config  (Team config update)
- GET  {{SERVER}}users  (Users list)
- GET  {{SERVER}}users/me  (User me)
- GET  {{SERVER}}users/global?search=co  (Users global search)
- GET  {{SERVER}}users/identify?search=core@liveui.io  (Users identify)
- POST  {{SERVER}}users  (Registration)
- GET  {{SERVER}}users/verify?token={{REGISTRATION_TOKEN}}  (Verify registration)
- POST  {{SERVER}}users/invite  (Invite user)
- POST  {{SERVER}}users/invite/finish?token={{INVITE_TOKEN}}  (Invite finish)
- PUT  {{SERVER}}users/{{TEST_USER_ID}}  (User update)
- GET  {{SERVER}}apps?limit=100&from=0&search=&platform=ios  (Apps overview)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/apps  (Team apps)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/apps/info  (Team apps info)
- DELETE  {{SERVER}}apps/{{APP_ID}}  (App delete)
- POST  {{SERVER}}teams/{{TEST_TEAM_ID}}/builds?tags=bricks  (Team build upload)
- POST  {{SERVER}}builds?token={{TEST_UPLOAD_KEY}}&tags=boost|bricks|bricklayer_1.2.3|mortar_v12  (Build upload token)
- POST  {{SERVER}}builds?token={{TEST_UPLOAD_KEY}}&tags=boost|bricks|bricklayer_1.2.3|mortar_v12&pm[ticket][url]=...  (Build upload token + info)
- GET  {{SERVER}}apps/{{APP_ID}}/builds  (App builds)
- GET  {{SERVER}}builds?limit=10&tags=bricks  (Builds list)
- GET  {{SERVER}}builds?limit=20&page=40&platform=ios  (Builds list filtered)
- GET  {{SERVER}}builds/{{BUILD_ID}}  (Build detail)
- GET  {{SERVER}}builds/{{BUILD_ID}}/auth  (Build auth)
- GET  {{SERVER}}builds/{{BUILD_ID}}/icon  (Build icon)
- GET  {{SERVER}}builds/{{BUILD_ID}}/history  (Build history)
- GET  {{SERVER}}builds/{{BUILD_ID}}/plist/{{DOWNLOAD_TOKEN}}/app.plist  (iOS manifest)
- GET  {{SERVER}}builds/file?token={{DOWNLOAD_TOKEN}}  (Build file download)
- DELETE  {{SERVER}}builds/{{BUILD_ID}}  (Build delete)
- GET  {{SERVER}}builds/{{BUILD_ID}}/tags  (Build tags)
- GET  {{SERVER}}tags?search=1.4  (Tags search)
- GET  {{SERVER}}tags/common  (Tags common)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/tags?search=1  (Team tags search)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/tags/common  (Team tags common)
- POST  {{SERVER}}builds/{{BUILD_ID}}/tags  (Build tags create)
- DELETE  {{SERVER}}builds/{{BUILD_ID}}/tags/{{TAG_ID}}  (Build tags delete)
- POST  {{SERVER}}teams/{{TEST_TEAM_ID}}/keys  (API keys create)
- POST  {{SERVER}}teams/{{TEST_TEAM_ID}}/keys  (API keys create with tags)
- GET  {{SERVER}}keys  (API keys list)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/keys  (Team keys list)
- GET  {{SERVER}}teams/{{TEST_TEAM_ID}}/keys  (Keys detail)
- PUT  {{SERVER}}keys/{{TEST_UPLOAD_KEY_ID}}  (Key update)
- DELETE  {{SERVER}}keys/{{TEST_UPLOAD_KEY_ID}}  (Key delete)
- POST  {{SERVER}}sdk  (SDK)
- GET  {{SERVER}}settings  (Settings list)
- GET  {{SERVER}}settings?plain=true  (Settings plain)
- POST  {{SERVER}}settings  (Settings create)
- PUT  {{SERVER}}settings/{{TEST_SETTING_ID}}  (Settings update)
- DELETE  {{SERVER}}settings/{{TEST_SETTING_ID}}  (Settings delete)
- POST  {{SERVER}}server/image  (Server image upload)
- GET  {{SERVER}}server/favicon/  (Server favicon)
- GET  {{SERVER}}server/image/  (Server image)
- GET  {{SERVER}}server/image/16  (Server image 16)
- GET  {{SERVER}}server/image/64  (Server image 64)
- GET  {{SERVER}}server/image/128  (Server image 128)
- GET  {{SERVER}}server/image/192  (Server image 192)
- GET  {{SERVER}}server/image/256  (Server image 256)
- GET  {{SERVER}}server/image/512  (Server image 512)
- GET  {{SERVER}}database  (Database info)
- GET  {{SERVER}}server/security  (Server security overview)
- GET  {{SERVER}}teapot  (Teapot)
- GET  {{SERVER}}ping  (Ping)
- GET  {{SERVER}}errors  (Errors)
- GET  {{SERVER}}info  (Info)
- GET  {{SERVER}}mode  (Mode)
- GET  {{SERVER}}server/flush  (Stdout flush)
- GET  {{SERVER}}server/commit  (Commit)
- GET  {{SERVER}}unknown  (Unknown URL)
- GET  {{SERVER}}templates  (Templates list)
- POST  {{SERVER}}templates  (Templates create)
- GET  {{SERVER}}templates/{{TEMPLATE_ID}}  (Template detail)
- PUT  {{SERVER}}templates/{{TEMPLATE_ID}}  (Template update)
- DELETE  {{SERVER}}templates/{{TEMPLATE_ID}}  (Template delete)

### Legacy Admin UI (Reference-Only)
- Source: dev/Einstore/EinstoreAdmin

#### Global layout
- Router + layout: `dev/Einstore/EinstoreAdmin/src/App.tsx`
- Layout shell: `dev/Einstore/EinstoreAdmin/src/parts/Layout.tsx`
  - Left sidebar (team switcher + nav)
  - Top header slot + optional action button (add build, add API key)
  - File dropzone for uploads (only when a team is selected)
- Sidebar navigation: `dev/Einstore/EinstoreAdmin/src/parts/Sidebar.tsx`
  - Team selector (All / Add team)
  - Links: Dashboard, API keys, Team & members
  - Footer: My profile, System settings (admin only), Logout

#### Routes and screens
Auth flow routes (public):
- `/` -> Login (default) `dev/Einstore/EinstoreAdmin/src/components/Login.tsx`
  - Supports BASIC and OAuth authenticators
  - Shows Register + Reset Password links depending on server config
- `/register` Registration form `dev/Einstore/EinstoreAdmin/src/parts/Auth.tsx`
- `/register-ok` Registration confirmation `dev/Einstore/EinstoreAdmin/src/parts/Auth.tsx`
- `/verify?token=...` Registration verification `dev/Einstore/EinstoreAdmin/src/parts/Auth.tsx`
- `/reset-password` Email reset request `dev/Einstore/EinstoreAdmin/src/parts/Auth.tsx`
- `/set-password?token=...` Set new password form `dev/Einstore/EinstoreAdmin/src/parts/Auth.tsx`
- `/invitation?token=...` Invite finish (username + password) `dev/Einstore/EinstoreAdmin/src/parts/Auth.tsx`
- `/oauth-result?info=...` OAuth callback processing `dev/Einstore/EinstoreAdmin/src/parts/Auth.tsx`

Authenticated routes:
- `/apps` Dashboard (all teams) `dev/Einstore/EinstoreAdmin/src/components/Overview.tsx`
- `/apps/:teamId` Dashboard (team scope) `dev/Einstore/EinstoreAdmin/src/components/Overview.tsx`
- `/app/:appId` App builds list (cluster) `dev/Einstore/EinstoreAdmin/src/parts/appBuilds.js`
- `/build/:buildId` Build detail (single build) `dev/Einstore/EinstoreAdmin/src/parts/appDetail.js`
- `/api-keys` API keys list (all teams) `dev/Einstore/EinstoreAdmin/src/components/ApiKeys.tsx`
- `/api-keys/:teamId` API keys list (team scope) `dev/Einstore/EinstoreAdmin/src/components/ApiKeys.tsx`
- `/add-api-key` Create API key `dev/Einstore/EinstoreAdmin/src/components/AddApiKey.tsx`
- `/add-api-key/:teamId` Create API key (team preselected) `dev/Einstore/EinstoreAdmin/src/components/AddApiKey.tsx`
- `/team` Team & members `dev/Einstore/EinstoreAdmin/src/parts/team.js`
- `/team/:teamId` Team & members (team selected) `dev/Einstore/EinstoreAdmin/src/parts/team.js`
- `/team/new` Add team `dev/Einstore/EinstoreAdmin/src/parts/AddTeam.tsx`
- `/me` My profile `dev/Einstore/EinstoreAdmin/src/parts/account.js`
- `/system` System settings (admin only) `dev/Einstore/EinstoreAdmin/src/parts/SystemSettings.tsx`

#### Screen details and behavior
Dashboard (Overview) `dev/Einstore/EinstoreAdmin/src/components/Overview.tsx`
- Cards grouped by app/cluster with build counts
- Search via tags (multi-select) + platform filter (all/ios/android)
- Sort by date or name (persisted in browser storage)
- Search results panel when tags are set
- Security overview banners for global view only
- Empty states: prompt to upload (team view) or select team (global)

Search UX
- TagSearch component `dev/Einstore/EinstoreAdmin/src/components/TagSearch.tsx`
  - Async suggestions for tags and apps (min 2 chars)
  - Default options from common tags
  - App suggestion renders icon + name

App builds list `dev/Einstore/EinstoreAdmin/src/parts/appBuilds.js`
- Header card with app icon/name/identifier + platform badge
- Paginated build list for that app
- Back button
- Delete all builds action

Build detail `dev/Einstore/EinstoreAdmin/src/parts/appDetail.js`
- Back button
- Build info card: icon, platform, version/build, size, date, identifier
- Install/download button based on device platform
- Info messages: PM ticket, PR, commit info (if provided)
- Tag list with add/remove
- Delete build action

Team & members `dev/Einstore/EinstoreAdmin/src/parts/team.js`
- Team selector (All / specific team)
- If no team selected: notice prompting to select team
- If team selected:
  - Edit team sheet (name, identifier, color, icon)
  - Invite form: first name, last name, email/username
  - Member list with role flags
  - Delete team panel (blocked for admin team)

Add team `dev/Einstore/EinstoreAdmin/src/parts/AddTeam.tsx`
- Name + identifier (slugified unless custom)
- Availability checker for identifier

API keys list `dev/Einstore/EinstoreAdmin/src/components/ApiKeys.tsx`
- Table with team, name, type, created date, actions
- Inline edit of name/type
- Delete key
- If recently created, displays token with copy action
- Empty state: prompt to add key

Add API key `dev/Einstore/EinstoreAdmin/src/components/AddApiKey.tsx`
- Team selector (unless preselected)
- Name input
- Type select (Upload/SDK)
- Creates key and returns to previous screen

My profile `dev/Einstore/EinstoreAdmin/src/parts/account.js`
- Edit first/last name, password change, email read-only

System settings (admin) `dev/Einstore/EinstoreAdmin/src/parts/SystemSettings.tsx`
- Server image upload with preview
- Config list with editable key/value fields
- Trigger \"template update\" action

### Legacy Data Model (Reference-Only)
- Source: dev/Einstore/EinstoreCore/Sources/EinstoreCore/Model
- TODO: map models and relationships

## New Design (MVP) - Extraction + Build Pipeline

### Goals
- Replace legacy “magic scripts” with explicit pipeline stages.
- Preserve legacy extraction behavior (IPA/APK) while expanding for modern iOS/Android (extensions, watch, AAB splits).
- Produce structured, target-aware metadata and compliance artifacts.

### Linux Tooling + Extraction Considerations (MVP)
iOS (IPA) on Linux:
- Unpack IPA (zip) to Payload/<App>.app, enumerate nested targets (.appex, Watch apps).
- Parse binary plist:
  - Use libplist tools (plistutil) or Python plistlib to decode Info.plist per target.
- Icons and asset catalogs:
  - If Assets.car exists, use acextract to dump images.
  - Fall back to standalone icon PNGs in bundle.
  - Choose primary icon by size (largest square PNG), store all icon sizes.
- Entitlements:
  - Use ldid -e <binary> to extract entitlements per target.
- Provisioning profiles:
  - Extract embedded.mobileprovision from main app and each extension.
  - Parse PKCS7 -> plist to read Team ID, App ID, expiration, entitlements.
- Privacy manifest:
  - Detect PrivacyInfo.xcprivacy in app or SDK bundles and parse as plist.

Android (APK/AAB) on Linux:
- APK metadata:
  - Use aapt/aapt2 dump badging to extract package, versionCode/versionName, SDK, permissions, icons.
  - Optionally run apktool for full manifest and resource decoding.
- AAB metadata:
  - Use bundletool to generate universal or split APKs from AAB.
  - Parse base + feature splits; capture module metadata and split dimensions.
- Icons:
  - Use aapt dump badging to locate icon paths and extract them from APK.
  - If icon is an adaptive XML, parse it to find foreground/background layers.
- Dynamic features:
  - Record module names and delivery settings from bundle config or manifests.

Toolchain requirements (Linux):
- unzip/zip utilities
- libplist or Python plistlib
- acextract (Assets.car)
- ldid (entitlements)
- openssl or CMS tool (mobileprovision parsing)
- aapt/aapt2 (Android SDK build-tools)
- apktool (optional deep decode)
- bundletool (AAB handling)

### Pipeline Stages (MVP)
1) **Ingress**
   - Accept IPA, APK, AAB uploads (binary + metadata).
   - Verify content type, size limits, and checksum.
2) **Unpack**
   - IPA: unzip to staging, detect Payload/<App>.app plus extensions.
   - APK: unzip for icon extraction; `aapt dump badging` for metadata.
   - AAB: unpack base + modules; read `bundletool` metadata for splits.
3) **Identity & Version**
   - App ID / bundle ID / application ID.
   - Version + build number(s).
   - Bundle metadata (display name, SDK/target SDK).
4) **Targets**
   - Enumerate targets (app + extensions, watch, wear, tv, etc.).
   - Assign platform and role (app, extension, widget, clip, feature).
   - Capture bundle/application identifiers per target.
5) **Icons & Assets**
   - Extract target-aware icon sets.
   - Choose “primary” icon by size role (legacy behavior uses largest by bytes).
   - Normalize PNG where required (iOS).
   - Store icon metadata: size, role, scale, file hash.
6) **Permissions & Entitlements**
   - iOS: entitlements and privacy manifests.
   - Android: permissions, features, SDK/target SDK, dynamic features.
7) **Variants / Splits**
   - Android: ABI/density/language splits from AAB, device-specific slices.
   - iOS: device family compatibility; watch pairing info.
8) **Signing & Compliance**
   - Identify signing identity, signing lineage (Android).
   - Store compliance artifacts (provision profile type, privacy manifests).
9) **Finalize**
   - Store Build + Target + Variant + Artifact data.
   - Make the build resolvable via `resolveInstall(buildId, device)`.

### IPA Extraction (MVP Behavior Spec)
Legacy reference: `dev/Einstore/EinstoreCore/Sources/EinstoreCore/Libs/Extractor/Ipa/Ipa.swift`
- Unpack IPA and read `Payload/<App>.app/Info.plist`.
- Capture:
  - Bundle ID: `CFBundleIdentifier`
  - Display name: `CFBundleDisplayName` fallback `CFBundleName`
  - Version: `CFBundleShortVersionString`
  - Build: `CFBundleVersion`
  - Minimum OS: `MinimumOSVersion`
  - Orientation: `UISupportedInterfaceOrientations`, `UISupportedInterfaceOrientations~ipad`
  - Device capabilities: `UIRequiredDeviceCapabilities`
  - Device family: `UIDeviceFamily`
- Provisioning type (legacy heuristic):
  - `embedded.mobileprovision` contains `ProvisionsAllDevices` -> enterprise
  - contains `ProvisionedDevices` -> adhoc
  - else appstore
- Icons:
  - Use `CFBundleIcons` and `CFBundleIcons~ipad` -> `CFBundlePrimaryIcon` -> `CFBundleIconFiles`
  - Choose icon with greatest byte size
  - Normalize PNG (legacy uses Normalized)
- MVP additions:
  - Enumerate app extensions in `PlugIns/` and treat each as Target
  - Parse `PrivacyInfo.xcprivacy` if present and store as ComplianceArtifact
  - Extract entitlements with ldid per target binary

### APK Extraction (MVP Behavior Spec)
Legacy reference: `dev/Einstore/EinstoreCore/Sources/EinstoreCore/Libs/Extractor/Apk/Apk.swift`
- Use `aapt dump badging` to extract:
  - package name, versionName, versionCode
  - sdkVersion, targetSdkVersion
  - permissions, features, locales, native code
  - application label
  - density icons
- Use `aapt dump resources` to locate icon path, unzip icon and choose largest by byte size
- MVP additions:
  - Extract app component metadata if available (split APKs)
  - Preserve dynamic feature module declarations

### AAB Extraction (MVP Behavior Spec)
- Use `bundletool` to parse bundle metadata.
- Identify:
  - base module + feature modules
  - SDK and target SDK
  - permissions and features
  - split dimensions: ABI, density, language
- Build variant records for each split dimension.
- Preserve signing lineage and key rotation metadata when available.

### Output Data (MVP)
- App: logical product
- Version: semantic version grouping
- Build: uploaded container with build metadata and compliance artifacts
- Target: platform + role + bundle/app ID + host relationship
- Variant: ABI/density/language/device slices
- Module: Android dynamic feature modules
- Capability: derived from entitlements/permissions/features
- ComplianceArtifact: privacy manifests, provisioning type, signing lineage
- SigningIdentity: certificate info and rotation lineage

### Storage
- Local filesystem storage or S3 (configurable).
- Store binaries, extracted assets, and compliance artifacts.
- Store only hashes + metadata in DB; large files in object storage.

### Device-Aware Resolver (MVP)
`resolveInstall(buildId, device)` should:
- Filter targets by platform + OS compatibility
- iOS: include watch targets if device paired with watch
- Android: select correct split APKs for device ABI/density/language
- Return manifest or file set appropriate for device

## MVP Completion Criteria
- IPA with extensions + watch installs correctly on iOS.
- AAB resolves correct split APK set for target Android device.
- Compliance artifacts visible and auditable in Admin UI.
## Refactor Plan (Actionable Checklist)

### Phase 0 - Repo/Branch Hygiene
- [ ] Rename default branch master -> main
- [ ] Create branch old with current legacy state
- [ ] Ensure dev/ remains gitignored reference-only
- [ ] Add auth submodule: /Libraries/rafiki-auth (rafiki/auth)

### Phase 1 - Legacy Mapping (No Coding)
- [x] Inventory critical IPA/APK extraction behavior
- [x] Inventory legacy endpoints (Postman)
- [ ] Map legacy data models and relationships
- [ ] Map legacy Admin UI screens, flows, and API usage

### Phase 2 - New Domain Model + Resolver Design
- [ ] Define new data model (App, Version, Build, Target, Variant, Module, Capability, ComplianceArtifact, SigningIdentity, Platform)
- [ ] Define device-aware resolver contract: resolveInstall(buildId, device)
- [ ] Define platform-agnostic compliance metadata representation
- [ ] Define asset extraction pipeline stages and outputs
- [ ] Define storage abstraction (local filesystem + S3)

### Phase 3 - Backend Foundation (/API)
- [ ] Scaffold Node/Fastify/Prisma/Postgres API
- [ ] Integrate rafiki270/auth plugin (external contract)
- [ ] Implement Zod validation patterns + request/response schemas
- [ ] Implement core entities + migrations
- [ ] Implement ingestion pipeline (IPA/AAB/APK parsing) as formal stages
- [ ] Implement device-aware resolver endpoints

### Phase 4 - Domain Porting (Endpoint-by-Endpoint)
- [ ] Port teams/users/auth-related endpoints (excluding auth provider specifics)
- [ ] Port apps/versions/builds endpoints with new data model
- [ ] Port tags/keys/templates/settings endpoints (as applicable)
- [ ] Create docs/api/endpoints.md + endpoints.json from implementation

### Phase 5 - Admin UI (Redesign)
- [ ] Document desired Admin flows based on legacy behavior
- [ ] Redesign UI for target-first and compliance-first workflow
- [ ] Implement Admin UI with React + Tailwind (CSR)

### Phase 6 - Web UI
- [ ] Implement end-user app browsing + install flows
- [ ] Integrate device-aware install resolver

### Phase 7 - Validation
- [ ] Verify iOS app with extensions + Watch installs correctly
- [ ] Verify Android AAB resolves correct split APKs
- [ ] Verify compliance artifacts visible/auditable
- [ ] Verify install failures are explained (permissions/signing/platform mismatch)

## Open Questions / Blockers
- Vapor org access blocked by 2FA policy; dependency queries may be incomplete.
- Need explicit Admin UI behavior mapping from legacy screens.
- Need definitive scope for API endpoints to keep/drop in the rewrite.
