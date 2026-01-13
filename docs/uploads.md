# Uploads and Processing

This document describes the upload and processing flow for IPA/APK/AAB files, optimized for large binaries.

## Goals
- The API never receives large binary payloads.
- Uploads stream directly to DigitalOcean Spaces.
- Processing reads only the zip entries needed (no full download).

## High-level flow
1) Client requests a presigned upload URL from the API.
2) Client uploads the binary directly to Spaces (streamed).
3) Client notifies the API with the object key to trigger processing.
4) DigitalOcean Function pulls only the required zip entry ranges from Spaces.
5) Function returns extracted metadata to the API.

## Upload flow (all platforms)
- API issues a presigned URL (PUT or POST) for Spaces.
- Client streams the binary to Spaces using the presigned URL.
- Browser PUT uploads use XHR and set only the headers returned by the API (typically none; macOS Safari uses a signed `Content-Type` header).
- Client calls the API with `{ storageKind: "s3", storagePath: "spaces://bucket/key" }` to start processing.
- For CI pipelines, use an API key (`x-api-key`) to authenticate upload and ingest calls.

## Processing flow (DigitalOcean Function)
### Common ZIP strategy
- Do not download the full file.
- Use HTTP range requests against the Spaces object to read:
  - ZIP End Of Central Directory (EOCD)
  - Central Directory entries
  - Only the entry bytes needed for metadata/icons

### IPA (iOS)
- Read these entries via range requests:
  - `Payload/<App>.app/Info.plist`
  - `Payload/<App>.app/PlugIns/<Extension>.appex/Info.plist`
  - `Payload/<App>.app/Watch/<WatchApp>.app/Info.plist`
  - `Payload/<App>.app/PrivacyInfo.xcprivacy` (if present)
  - `Payload/<App>.app/embedded.mobileprovision` (if present)
  - `Payload/<App>.app/Assets.car` (icons)
- Parse Info.plist files for identifiers, names, versions, orientations, device families.
- Extract icons by reading only needed PNGs or by extracting from Assets.car (range-read Assets.car, then decode in the Function).
- Normalize extracted icon PNGs (revert CgBI optimizations, force sRGB + alpha, strip metadata, validate PNG integrity) before upload.

### APK (Android)
- Read these entries via range requests:
  - `AndroidManifest.xml`
  - Icon resources referenced by the manifest/aapt output
- Decode the manifest (aapt2 or a library).
- Extract only the icon PNGs needed for display (highest density).

### AAB (Android)
- Keep the .aab stored in Spaces.
- Use bundletool with a device spec to create an `.apks` set (device-specific).
- Do not extract all APKs. Read only the split APK entries needed via zip range reads.

## Storage
- Binaries and images are written directly to Spaces by the Function.
- The API stores metadata, references, and Spaces object paths.

## Security and size constraints
- Presigned URLs must be time-limited and scoped to one object key.
- For Android AAB resolution, enforce the 4 GB compressed APK set limit.
- For iOS installs, plist and IPA download URLs must be HTTPS with valid certificates.
