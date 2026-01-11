# Einstore API Endpoints

All endpoints return JSON. Authenticated endpoints require `Authorization: Bearer <token>` issued by `rafiki270/auth`.

## Team scoping
Team-scoped endpoints require `x-team-id` (a Team ID you belong to). If omitted, the API falls back to your `lastActiveTeamId`. Responses are restricted to that team.

Team-scoped endpoints:
- `/apps`, `/apps/:id`
- `/versions`, `/versions/:id`
- `/builds`, `/builds/:id`
- `/builds/:id/downloads`
- `/builds/:id/installs`
- `/targets`
- `/variants`
- `/modules`
- `/capabilities`
- `/artifacts`
- `/storage`
- `/resolve-install`
- `/ingest`, `/ingest/upload`
- `/badges`
- `/api-keys`, `/api-keys/:id`
- `/ws`
- `/usage/storage/users`
- `/teams/stats`
- `/builds/:id/ios/install-link`
- `/builds/:id/ios/manifest`
- `/builds/:id/ios/download`
- `/builds/:id/ios/installs/track`
- `/search`

## GET /health
- Purpose: Health check
- Auth scope: None
- Request schema: none
- Response schema: `{ "status": "ok" }`
- Side effects: none
- Platform relevance: all

## GET /info
- Purpose: Service metadata
- Auth scope: None
- Request schema: none
- Response schema: `{ "name": string, "version": string }`
- Side effects: none
- Platform relevance: all

## GET /search
- Purpose: Search apps and builds by name, identifier, version, or build number
- Auth scope: Team
- Request schema: query params
  - `q` (string, required): search term
  - `appId` (string, optional): filter builds by app ID
  - `appLimit` (number, optional, default 10): max apps returned
  - `buildLimit` (number, optional, default 6): max builds returned
- Response schema: `{ "apps": [{ "id": "app", "name": "App", "identifier": "com.app" }], "builds": [{ "id": "build", "buildNumber": "42", "displayName": "Release", "version": "1.0.0", "createdAt": "2026-01-11T00:00:00.000Z", "appId": "app", "appName": "App", "appIdentifier": "com.app" }] }`
- Side effects: none
- Platform relevance: all

## GET /badges
- Purpose: Fetch navigation badge counts for the active team
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: none
- Response schema: `{ badges: { apps: number, builds: number } }`
- Side effects: none
- Platform relevance: all

## GET /ws
- Purpose: WebSocket for real-time badge updates
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: none (uses `Authorization` header when available, otherwise `accessToken` query param; `x-team-id` header or `teamId` query param for team context)
- Response schema: WebSocket messages like `{ type: "badges.updated", badges: { apps: number, builds: number } }`
- Side effects: none
- Platform relevance: all

## GET /usage/storage/users
- Purpose: Storage usage by user for the active team
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: none
- Response schema: `{ users: Array<{ userId: string, username: string, email: string | null, fullName: string | null, buildCount: number, totalBytes: number }> }`
- Side effects: none
- Platform relevance: all

## GET /teams/stats
- Purpose: Team-level storage and transfer stats
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: none
- Response schema: `{ billingCycleStartAt: string, totalStorageBytes: number, downloadsThisMonth: { from: string, eventCount: number, bytes: number }, uploadsInBillingCycle: { from: string, buildCount: number, appCount: number, bytes: number } }`
- Side effects: none
- Platform relevance: all

## GET /api-keys
- Purpose: List API keys for the active team (admin/owner only)
- Auth scope: Bearer (rafiki270/auth) + Team admin membership
- Request schema: none
- Response schema: `{ apiKeys: Array<{ id: string, name: string, prefix: string, createdAt: string, lastUsedAt: string | null, revokedAt: string | null, expiresAt: string | null, createdBy: { id: string, name: string | null, email: string | null, username: string } | null }> }`
- Side effects: none
- Platform relevance: all

## POST /api-keys
- Purpose: Create a new API key for CI uploads (admin/owner only)
- Auth scope: Bearer (rafiki270/auth) + Team admin membership
- Request schema: `{ name: string, expiresAt?: string }`
- Response schema: `{ apiKey: { id: string, name: string, prefix: string, createdAt: string, lastUsedAt: string | null, revokedAt: string | null, expiresAt: string | null, createdBy: { id: string, name: string | null, email: string | null, username: string } | null }, token: string }`
- Side effects: Stores a hashed API key; token returned once
- Platform relevance: all

## DELETE /api-keys/{id}
- Purpose: Revoke an API key (admin/owner only)
- Auth scope: Bearer (rafiki270/auth) + Team admin membership
- Request schema: none
- Response schema: `{ revoked: true }`
- Side effects: Marks the key revoked; CI uploads will stop
- Platform relevance: all

## POST /builds/{id}/downloads
- Purpose: Record a build download event
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: `{ platform?: PlatformKind, targetId?: string, deviceId?: string, metadata?: object }`
- Response schema: `BuildEvent`
- Side effects: Creates a build event record (download)
- Platform relevance: all

## GET /builds/{id}/downloads
- Purpose: List build download events
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: query `{ limit?: number, offset?: number }`
- Response schema: `BuildEvent[]`
- Side effects: none
- Platform relevance: all

## POST /builds/{id}/installs
- Purpose: Record a build install event
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: `{ platform?: PlatformKind, targetId?: string, deviceId?: string, metadata?: object }`
- Response schema: `BuildEvent`
- Side effects: Creates a build event record (install)
- Platform relevance: all

## GET /builds/{id}/installs
- Purpose: List build install events
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: query `{ limit?: number, offset?: number }`
- Response schema: `BuildEvent[]`
- Side effects: none
- Platform relevance: all

## POST /builds/{id}/ios/install-link
- Purpose: Create a short-lived iOS install link (manifest + download)
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: none
- Response schema: `{ manifestUrl: string, itmsServicesUrl: string, downloadUrl: string, installTrackUrl: string, expiresAt: string }`
- Side effects: none
- Platform relevance: iOS

## GET /builds/{id}/ios/manifest
- Purpose: Fetch the signed iOS install manifest (plist)
- Auth scope: Presigned token (query `token`)
- Request schema: query `{ token: string }`
- Response schema: plist XML
- Side effects: none
- Platform relevance: iOS

## GET /builds/{id}/ios/download
- Purpose: Download the IPA via signed link (streams local or redirects to presigned S3/Spaces URL)
- Auth scope: Presigned token (query `token`)
- Request schema: query `{ token: string }`
- Response schema: binary stream or redirect
- Side effects: Records a download event
- Platform relevance: iOS

## POST /builds/{id}/ios/installs/track
- Purpose: Record an install event from a signed client callback
- Auth scope: Presigned token (query `token`)
- Request schema: `{ platform?: PlatformKind, targetId?: string, deviceId?: string, metadata?: object }`
- Response schema: `BuildEvent`
- Side effects: Records an install event
- Platform relevance: iOS

## POST /auth/register
- Purpose: Register a new user
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: `{ username: string, password: string, email?: string }`
- Response schema: `{ userId: string, session: { accessToken: string, refreshToken: string, expiresIn: number } }`
- Side effects: Creates user, credential, session; ensures a personal team on first login; first user is marked super user
- Platform relevance: all

## POST /auth/login
- Purpose: Authenticate user
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: `{ identifier: string, password: string }`
- Response schema: `{ userId: string, session: { accessToken: string, refreshToken: string, expiresIn: number } }`
- Side effects: Creates session; ensures a personal team on first login
- Platform relevance: all

## POST /auth/refresh
- Purpose: Refresh access token
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: `{ refreshToken: string }`
- Response schema: `{ session: { accessToken: string, refreshToken: string, expiresIn: number } }`
- Side effects: Rotates refresh token
- Platform relevance: all

## POST /auth/logout
- Purpose: Revoke refresh token
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: `{ refreshToken: string }`
- Response schema: `{ revoked: true }`
- Side effects: Revokes session
- Platform relevance: all

## GET /auth/session
- Purpose: Validate access token
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: none (uses Authorization header)
- Response schema: `{ userId: string, username: string, email?: string | null, name?: string | null, avatarUrl?: string | null, status: string, isSuperUser: boolean }`
- Side effects: none
- Platform relevance: all

## POST /auth/password-reset
- Purpose: Request password reset
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: `{ email: string }`
- Response schema: `{ token: string }`
- Side effects: Issues password reset token
- Platform relevance: all

## POST /auth/password-reset/confirm
- Purpose: Complete password reset
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: `{ token: string, newPassword: string }`
- Response schema: `{ status: string }`
- Side effects: Updates credential
- Platform relevance: all

## GET /auth/oauth/{provider}/start
- Purpose: Start OAuth login (Google/Apple)
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: query `{ redirectUri: string, successRedirect: string, failureRedirect: string, codeChallenge?: string, codeVerifier?: string }`
- Response schema: `{ authorizeUrl: string }`
- Side effects: Issues OAuth state token
- Platform relevance: all

## GET /auth/oauth/{provider}/callback
- Purpose: Handle OAuth callback and redirect to the app
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: query `{ state: string, code?: string, error?: string, error_description?: string }`
- Response schema: Redirect (302) to success/failure URL
- Side effects: Creates auth code
- Platform relevance: all

## POST /auth/oauth/exchange
- Purpose: Exchange OAuth auth code for session
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: `{ authCode: string }`
- Response schema: `{ session: { accessToken: string, refreshToken: string, expiresIn: number } }`
- Side effects: Creates session; ensures a personal team on first login; first user is marked super user
- Platform relevance: all

## GET /teams
- Purpose: List teams for the authenticated user
- Auth scope: Bearer (rafiki270/auth)
- Request schema: none
- Response schema: `{ teams: Team[] }` (includes `memberRole`)
- Side effects: none
- Platform relevance: all

## POST /teams
- Purpose: Create a new team and set it as active
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ name: string, slug?: string, defaultCurrency?: string, billingCurrency?: string, defaultExportPreset?: string, overviewStatsPeriod?: string, vatRegistered?: boolean, vatNumberRequired?: boolean, categoryRequired?: boolean, vatMissingThresholdMinor?: number, country?: string, timezone?: string }`
- Response schema: `{ team: Team }`
- Side effects: Creates Team + TeamMember (owner), updates last active team
- Platform relevance: all

## GET /teams/{teamId}
- Purpose: Fetch current team details
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: path `{ teamId: string }`
- Response schema: `{ team: Team }`
- Side effects: none
- Platform relevance: all

## PATCH /teams/{teamId}
- Purpose: Update team settings
- Auth scope: Bearer (rafiki270/auth) + Team role (owner/admin)
- Request schema: `{ name?: string, slug?: string, defaultCurrency?: string, defaultExportPreset?: string, overviewStatsPeriod?: string, vatRegistered?: boolean, vatNumberRequired?: boolean, categoryRequired?: boolean, vatMissingThresholdMinor?: number, country?: string, timezone?: string }`
- Response schema: `{ team: Team }`
- Side effects: Updates Team
- Platform relevance: all

## GET /teams/{teamId}/users
- Purpose: List team members
- Auth scope: Bearer (rafiki270/auth) + Team role (owner/admin)
- Request schema: path `{ teamId: string }`
- Response schema: `{ users: TeamUser[] }`
- Side effects: none
- Platform relevance: all

## POST /teams/{teamId}/users
- Purpose: Add a user to the team
- Auth scope: Bearer (rafiki270/auth) + Team role (owner/admin)
- Request schema: `{ email: string }`
- Response schema: `{ user: TeamUser }`
- Side effects: Creates TeamMember
- Platform relevance: all

## PATCH /teams/{teamId}/users/{userId}
- Purpose: Update a team member role
- Auth scope: Bearer (rafiki270/auth) + Team role (owner/admin)
- Request schema: `{ role: "owner" | "admin" | "member" }`
- Response schema: `{ user: TeamUser }`
- Side effects: Updates TeamMember
- Platform relevance: all

## DELETE /teams/{teamId}/users/{userId}
- Purpose: Remove a team member (may promote another owner if needed)
- Auth scope: Bearer (rafiki270/auth) + Team role (owner/admin)
- Request schema: none
- Response schema: `{ removedUserId: string, promotedUserId: string | null }`
- Side effects: Deletes TeamMember, may promote another admin
- Platform relevance: all

## POST /teams/{teamId}/select
- Purpose: Set active team for current user
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: none
- Response schema: `{ activeTeamId: string }`
- Side effects: Updates user lastActiveTeamId
- Platform relevance: all

## GET /teams/{teamId}/inbox
- Purpose: Resolve team inbox address
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: none
- Response schema: `{ address: string }`
- Side effects: none
- Platform relevance: all

## GET /user-team-settings/{key}
- Purpose: Fetch a user/team-scoped setting
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: path `{ key: string }`
- Response schema: `{ key: string, value: any | null }`
- Side effects: none
- Platform relevance: all

## PUT /user-team-settings/{key}
- Purpose: Upsert a user/team-scoped setting
- Auth scope: Bearer (rafiki270/auth) + Team membership
- Request schema: `{ value: any | null }`
- Response schema: `{ key: string, value: any | null }`
- Side effects: Creates or updates UserTeamSetting
- Platform relevance: all

## POST /apps
- Purpose: Create app
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ name: string, identifier: string }`
- Response schema: `App`
- Side effects: Creates App record
- Platform relevance: all

## GET /apps
- Purpose: List apps
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ limit?: number, offset?: number }`
- Response schema: `App[]`
- Side effects: none
- Platform relevance: all

## GET /apps/{id}
- Purpose: Fetch app with versions
- Auth scope: Bearer (rafiki270/auth)
- Request schema: path `{ id: string }`
- Response schema: `App & { versions: Version[] }`
- Side effects: none
- Platform relevance: all

## POST /versions
- Purpose: Create version for app
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ appId: string, version: string }`
- Response schema: `Version`
- Side effects: Creates Version record
- Platform relevance: all

## GET /versions
- Purpose: List versions for app
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ appId: string }`
- Response schema: `Version[]`
- Side effects: none
- Platform relevance: all

## GET /versions/{id}
- Purpose: Fetch version with builds
- Auth scope: Bearer (rafiki270/auth)
- Request schema: path `{ id: string }`
- Response schema: `Version & { builds: Build[] }`
- Side effects: none
- Platform relevance: all

## POST /builds
- Purpose: Create build (and upsert app/version)
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ appIdentifier: string, appName: string, version: string, buildNumber: string, displayName: string, storageKind: "local"|"s3", storagePath: string, sizeBytes: number }`
- Response schema: `Build`
- Side effects: Creates App, Version, Build
- Platform relevance: ios, android

## GET /builds
- Purpose: List builds for app
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ appId: string }`
- Response schema: `Build[]`
- Side effects: none
- Platform relevance: ios, android

## GET /builds/{id}
- Purpose: Fetch build with targets/variants/modules/artifacts
- Auth scope: Bearer (rafiki270/auth)
- Request schema: path `{ id: string }`
- Response schema: `Build & { targets: Target[], variants: Variant[], modules: Module[], artifacts: ComplianceArtifact[] }`
- Side effects: none
- Platform relevance: ios, android

## GET /builds/{id}/metadata
- Purpose: Fetch build metadata with artifacts grouped by kind plus targets/app/version context
- Auth scope: Bearer (rafiki270/auth)
- Request schema: path `{ id: string }`
- Response schema: `Build & { version: Version & { app: App }, targets: Target[], artifacts: ComplianceArtifact[], signing?: SigningIdentity, artifactsByKind: Record<string, ComplianceArtifact[]> }`
- Side effects: none
- Platform relevance: ios, android
- Notes:
  - iOS Info.plist fields live in `targets[].metadata.info`; entitlements in `artifactsByKind.entitlements`.
  - Android permissions live in `artifactsByKind.permissions`.

## GET /builds/{id}/icons
- Purpose: List extracted icon images for build targets
- Auth scope: Bearer (rafiki270/auth)
- Request schema: path `{ id: string }`
- Response schema: `{ buildId: string, items: { targetId: string, bundleId: string, platform: string, role: string, iconBitmap: { width?: number, height?: number, sizeBytes?: number, sourcePath?: string }, url: string, contentType: string, dataUrl: string }[] }`
- Side effects: none
- Platform relevance: ios, android

## GET /builds/{id}/icons/{targetId}
- Purpose: Fetch the extracted icon image for a target
- Auth scope: Bearer (rafiki270/auth)
- Request schema: path `{ id: string, targetId: string }`
- Response schema: `image/png`
- Side effects: none
- Platform relevance: ios, android

## POST /targets
- Purpose: Create target
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ buildId: string, platform: string, role: string, bundleId: string, hostTargetId?: string, minOsVersion?: string, metadata?: object }`
- Response schema: `Target`
- Side effects: Creates Target record
- Platform relevance: ios, android

## GET /targets
- Purpose: List targets for build
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ buildId: string }`
- Response schema: `Target[]`
- Side effects: none
- Platform relevance: ios, android

## POST /variants
- Purpose: Create variant
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ buildId: string, kind: string, key: string, value: string, metadata?: object }`
- Response schema: `Variant`
- Side effects: Creates Variant record
- Platform relevance: android

## GET /variants
- Purpose: List variants for build
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ buildId: string }`
- Response schema: `Variant[]`
- Side effects: none
- Platform relevance: android

## POST /modules
- Purpose: Create module
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ buildId: string, name: string, onDemand?: boolean, metadata?: object }`
- Response schema: `Module`
- Side effects: Creates Module record
- Platform relevance: android

## GET /modules
- Purpose: List modules for build
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ buildId: string }`
- Response schema: `Module[]`
- Side effects: none
- Platform relevance: android

## POST /capabilities
- Purpose: Create capability for target
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ targetId: string, name: string, metadata?: object }`
- Response schema: `Capability`
- Side effects: Creates Capability record
- Platform relevance: ios

## GET /capabilities
- Purpose: List capabilities for target
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ targetId: string }`
- Response schema: `Capability[]`
- Side effects: none
- Platform relevance: ios

## POST /artifacts
- Purpose: Create compliance artifact
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ buildId: string, kind: string, label?: string, storageKind: "local"|"s3", storagePath: string, metadata?: object }`
- Response schema: `ComplianceArtifact`
- Side effects: Creates ComplianceArtifact record
- Platform relevance: ios, android

## GET /artifacts
- Purpose: List compliance artifacts for build
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ buildId: string }`
- Response schema: `ComplianceArtifact[]`
- Side effects: none
- Platform relevance: ios, android

## POST /resolve-install
- Purpose: Resolve device-aware install
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ buildId: string, device: { platform: string, osVersion?: string, model?: string, locale?: string, abi?: string, density?: string } }`
- Response schema: `{ buildId: string, targetId?: string, variants?: Variant[] }`
- Side effects: none
- Platform relevance: ios, android
- Notes:
  - iOS: the returned install manifest must embed a prevalidated HTTPS download URL. The plist itself is not protected, so the file URL must be tokenized.
  - Local storage: generate a short-lived tokenized download URL for the IPA.
  - S3 storage: generate a time-limited pre-signed HTTPS URL for the IPA.
  - Both the plist URL and the download URL must be HTTPS with valid certificates.
  - Android: when resolving AABs, use bundletool with a device spec (ABI, density, language, sdkVersion) to generate the device-specific APK set.
  - Android: enforce compressed APK set size <= 4 GB (base + config splits).

## GET /storage
- Purpose: Get active storage configuration
- Auth scope: Bearer (rafiki270/auth)
- Request schema: none
- Response schema: `{ kind: "local"|"s3", metadata?: object }`
- Side effects: none
- Platform relevance: ios, android

## POST /storage
- Purpose: Set active storage configuration
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ kind: "local"|"s3", metadata?: object }`
- Response schema: `{ kind: "local"|"s3", metadata?: object }`
- Side effects: Updates storage settings
- Platform relevance: ios, android

## POST /ingest
- Purpose: Ingest build metadata from IPA/APK
- Auth scope: Bearer (rafiki270/auth) or `x-api-key` (CI uploads)
- Request schema: `{ filePath: string, kind: "ipa"|"apk"|"aab" }`
- Response schema: `{ status: string, result: object }`
- Side effects: Parses file, creates/updates App/Version/Build/Target/Artifacts
- Platform relevance: ios, android
- Notes:
  - iOS: extracts entitlements/provisioning profile and stores an `entitlements` artifact with `distribution` = adhoc | appstore | enterprise | none | broken.
  - Errors: `400 invalid_archive` when the IPA/APK is not a valid zip archive.

## POST /ingest/upload
- Purpose: Upload and ingest an IPA/APK in one step
- Auth scope: Bearer (rafiki270/auth) or `x-api-key` (CI uploads)
- Request schema: multipart form with `file`
- Response schema: `{ status: string, result: object }`
- Side effects: Stores upload on the server, then ingests metadata
- Platform relevance: ios, android
- Notes:
  - Errors: `400 invalid_archive` when the IPA/APK is not a valid zip archive.

## POST /feature-flags
- Purpose: Create/ensure feature flag
- Auth scope: Bearer (super user)
- Request schema: `{ key: string, description?: string, defaultEnabled?: boolean, metadata?: object }`
- Response schema: `FeatureFlag`
- Side effects: Creates or updates FeatureFlag
- Platform relevance: all

## GET /feature-flags
- Purpose: List feature flags
- Auth scope: Bearer (super user)
- Request schema: query `{ limit?: number, offset?: number }`
- Response schema: `FeatureFlag[]`
- Side effects: none
- Platform relevance: all

## GET /feature-flags/{key}
- Purpose: Fetch feature flag with overrides
- Auth scope: Bearer (super user)
- Request schema: path `{ key: string }`
- Response schema: `FeatureFlag & { overrides: FeatureFlagOverride[] }`
- Side effects: none
- Platform relevance: all

## PATCH /feature-flags/{key}
- Purpose: Update feature flag
- Auth scope: Bearer (super user)
- Request schema: `{ description?: string|null, defaultEnabled?: boolean, metadata?: object|null }`
- Response schema: `FeatureFlag`
- Side effects: Updates FeatureFlag
- Platform relevance: all

## DELETE /feature-flags/{key}
- Purpose: Delete feature flag
- Auth scope: Bearer (super user)
- Request schema: path `{ key: string }`
- Response schema: `FeatureFlag`
- Side effects: Deletes FeatureFlag and overrides
- Platform relevance: all

## POST /feature-flags/{key}/overrides
- Purpose: Create/update feature flag override
- Auth scope: Bearer (super user)
- Request schema: `{ scope: string, targetKey?: string|null, enabled: boolean, rolloutPercentage?: number, metadata?: object }`
- Response schema: `FeatureFlagOverride`
- Side effects: Creates or updates override
- Platform relevance: all

## GET /feature-flags/{key}/overrides
- Purpose: List feature flag overrides
- Auth scope: Bearer (super user)
- Request schema: query `{ scope?: string, targetKey?: string }`
- Response schema: `FeatureFlagOverride[]`
- Side effects: none
- Platform relevance: all

## GET /feature-flags/{key}/evaluate
- Purpose: Evaluate flag for scope/target
- Auth scope: Bearer (super user)
- Request schema: query `{ scope?: string, targetKey?: string }`
- Response schema: `{ key: string, enabled: boolean }`
- Side effects: Auto-creates missing flag via feature flag library
- Platform relevance: all
