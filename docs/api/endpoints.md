# Einstore API Endpoints

All endpoints return JSON. Authenticated endpoints require `Authorization: Bearer <token>` issued by `rafiki270/auth`.

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

## POST /auth/register
- Purpose: Register a new user
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: `{ username: string, password: string, email?: string }`
- Response schema: `{ userId: string, session: { accessToken: string, refreshToken: string, expiresIn: number } }`
- Side effects: Creates user, credential, session
- Platform relevance: all

## POST /auth/login
- Purpose: Authenticate user
- Auth scope: Public (handled by rafiki270/auth)
- Request schema: `{ identifier: string, password: string }`
- Response schema: `{ userId: string, session: { accessToken: string, refreshToken: string, expiresIn: number } }`
- Side effects: Creates session
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
- Response schema: `{ user: { id: string } }`
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
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ filePath: string, kind: "ipa"|"apk"|"aab" }`
- Response schema: `{ status: string, result: object }`
- Side effects: Parses file, creates/updates App/Version/Build/Target/Artifacts
- Platform relevance: ios, android

## POST /feature-flags
- Purpose: Create/ensure feature flag
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ key: string, description?: string, defaultEnabled?: boolean, metadata?: object }`
- Response schema: `FeatureFlag`
- Side effects: Creates or updates FeatureFlag
- Platform relevance: all

## GET /feature-flags
- Purpose: List feature flags
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ limit?: number, offset?: number }`
- Response schema: `FeatureFlag[]`
- Side effects: none
- Platform relevance: all

## GET /feature-flags/{key}
- Purpose: Fetch feature flag with overrides
- Auth scope: Bearer (rafiki270/auth)
- Request schema: path `{ key: string }`
- Response schema: `FeatureFlag & { overrides: FeatureFlagOverride[] }`
- Side effects: none
- Platform relevance: all

## PATCH /feature-flags/{key}
- Purpose: Update feature flag
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ description?: string|null, defaultEnabled?: boolean, metadata?: object|null }`
- Response schema: `FeatureFlag`
- Side effects: Updates FeatureFlag
- Platform relevance: all

## DELETE /feature-flags/{key}
- Purpose: Delete feature flag
- Auth scope: Bearer (rafiki270/auth)
- Request schema: path `{ key: string }`
- Response schema: `FeatureFlag`
- Side effects: Deletes FeatureFlag and overrides
- Platform relevance: all

## POST /feature-flags/{key}/overrides
- Purpose: Create/update feature flag override
- Auth scope: Bearer (rafiki270/auth)
- Request schema: `{ scope: string, targetKey?: string|null, enabled: boolean, rolloutPercentage?: number, metadata?: object }`
- Response schema: `FeatureFlagOverride`
- Side effects: Creates or updates override
- Platform relevance: all

## GET /feature-flags/{key}/overrides
- Purpose: List feature flag overrides
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ scope?: string, targetKey?: string }`
- Response schema: `FeatureFlagOverride[]`
- Side effects: none
- Platform relevance: all

## GET /feature-flags/{key}/evaluate
- Purpose: Evaluate flag for scope/target
- Auth scope: Bearer (rafiki270/auth)
- Request schema: query `{ scope?: string, targetKey?: string }`
- Response schema: `{ key: string, enabled: boolean }`
- Side effects: Auto-creates missing flag via feature flag library
- Platform relevance: all
