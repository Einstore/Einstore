# Einstore — Pricing, Plans & Enforcement Rules (Stripe Implementation Spec)

This document defines subscription tariffs, quotas, and enforcement rules for **Einstore**, an enterprise app store and developer SaaS.  
It is written to be directly consumable by an LLM implementing **Stripe subscriptions** and app-side quota enforcement.

---

## Core Concepts

- **Account**: Stripe Customer
- **Subscription**: Exactly one active plan per account
- **Team**: Workspace tied to a subscription
- **App**: Mobile application hosted in Einstore
- **Build**: Uploaded binary (counts toward storage)
- **Transfer Out**: Downloads / installs / OTA distribution traffic

---

## Plan 0 — Free

**Price**  
$0 / month

**Limits**
- Apps: 1
- Teams: 1 free team only
- Users: 1
- Builds per app: Unlimited (subject to storage rules)
- Storage: 250 MB total
- Transfer out: 1 GB / month

**Rules / Guards**
- Reject creation of a second app → suggest paid plan
- Reject accepting any team invite unless target team is on a paid plan
- Build upload rules:
  - If upload exceeds storage:
    - Auto-delete oldest build(s) for that app first
    - If still over limit → reject upload
  - If single build exceeds available quota → reject
- If transfer quota exceeded → block downloads/install
- All rejections must be graceful and include upgrade suggestion

---

## Plan 1 — Starter

**Price**  
$4.99 / month

**Limits**
- Apps: 3
- Users: 3
- Builds per app: 10
- Storage: 1 GB total
- Transfer out: 10 GB / month

**Rules**
- Reject actions exceeding app, user, or build limits
- Build upload rules:
  - Auto-delete oldest build(s) within the same app if needed
  - Reject if still over storage limit
- Reject downloads/install when transfer quota exceeded
- Team invites allowed within user limit
- If `TeamLimitOverride.maxUsers` is set, treat it as the hard cap for invites and direct member adds.

---

## Plan 2 — Team

**Price**  
$45 / month

**Limits**
- Apps: Unlimited
- Users: 25
- Builds per app: Unlimited
- Storage: 1 TB total
- Transfer out: 5 TB / month

**Rules**
- Reject inviting users beyond 25
- Storage is a hard cap (no auto-delete beyond limit)
- Reject downloads/install when transfer quota exceeded
- Full team collaboration enabled

---

## Plan 3 — Enterprise

**Price**  
$499 / month

**Limits**
- Apps: Unlimited
- Users: Unlimited
- Builds per app: Unlimited
- Storage: 10 TB total
- Transfer out: 100 TB / month

**Rules**
- Storage and transfer are hard caps
- No app, user, or build-count restrictions
- Intended for large organisations and CI-heavy usage

---

## Add-Ons

### Priority Support

**Price**  
$799 / month

**Includes**
- Support channels: WhatsApp + Email
- SLA: Response within 12 hours
- Priority response window: UK working hours (GMT)

**Rules**
- Requires an active paid plan
- Implement as a separate Stripe subscription or add-on product

---

## Stripe Implementation Notes

- Each plan maps to a Stripe Product with a monthly recurring Price
- Enforce quotas application-side (not via Stripe)
- One active subscription per account
- On downgrade:
  - Lock features exceeding limits
  - Do not delete data automatically
  - Require user action to comply
- On over-quota events:
  - Block the action
  - Return structured error with `upgrade_suggestion = true`

---

## Machine-Readable Limits Summary

```json
{
  "free": {
    "apps": 1,
    "users": 1,
    "storage_mb": 250,
    "transfer_gb": 1,
    "team_invites": false
  },
  "starter": {
    "price": 4.99,
    "apps": 3,
    "users": 3,
    "builds_per_app": 10,
    "storage_gb": 1,
    "transfer_gb": 10
  },
  "team": {
    "price": 45,
    "apps": "unlimited",
    "users": 25,
    "storage_tb": 1,
    "transfer_tb": 5
  },
  "enterprise": {
    "price": 499,
    "apps": "unlimited",
    "users": "unlimited",
    "storage_tb": 10,
    "transfer_tb": 100
  }
}
```

---

## Billing Module Contract (API-Side Gates)

- If the external Billing module is **absent** (self-host): every `can*` check defaults to `true` and no blocking is applied.
- If the Billing module is **present**: every gate must defer to Billing decisions; no local overrides.
- Cache Billing responses for the current UI session (e.g., per access token / page load) to avoid repeated DB hits; refresh cache on subscription change events.
- Checks run **API-side only**; UI can show hints but must rely on API enforcement.

### Boolean checks to expose

- [ ] `canCreateTeam(userId) -> bool` — block extra teams when plan forbids multiple teams (Plan 0).
- [ ] `canInviteOrAccept(teamId, targetUserId) -> bool` — enforce paid-plan-only invites (Plan 0) and seat caps (Starter/Team).
- [ ] `canCreateApp(teamId) -> bool` — enforce app count limits.
- [ ] `canUploadBuild(teamId, appId, sizeBytes) -> bool` — enforce storage cap and per-app build-count rules before ingest.
- [ ] `canDownloadBuild(teamId, buildId) -> bool` — enforce transfer quota before issuing any download URL/token.
- [ ] `canUsePrioritySupport(teamId) -> bool` — ensure add-on present before surfacing contact options.
- [ ] `canAccessEnterpriseFeatures(teamId) -> bool` — placeholder for future enterprise-only toggles.

> Return structured denials: `{ allowed: false, reason, upgrade_suggestion: true, planRequired }`.

---

## Enforcement Checklist (endpoints and scenarios)

- [ ] **Team creation** — `POST /auth/register` (personal team bootstrap) and any future team create endpoint: call `canCreateTeam` before creating secondary teams; allow personal team on Free only.
- [ ] **Team invites / accept** — wherever membership creation occurs (Team service / future `/teams/:id/invite`): call `canInviteOrAccept`; reject for Free plan or when exceeding seat cap for Starter (3) / Team (25); allow unlimited on Enterprise.
- [ ] **App creation** — `POST /apps`: gate with `canCreateApp` using team app count + plan max (Free:1, Starter:3, Team/Enterprise: unlimited); include upgrade suggestion on rejection.
- [ ] **Build record creation** — `POST /builds`: gate with `canUploadBuild` using per-app build cap (Starter:10/app) and storage forecast (`sizeBytes`); if denied, return `storage_limit_exceeded` or `build_limit_exceeded` with `upgrade_suggestion`.
- [ ] **Upload URLs (presigned)** — `POST /ingest/upload-url`: call `canUploadBuild` with declared `sizeBytes`; deny before issuing signed URL.
- [ ] **Finalize remote upload** — `POST /ingest/complete-upload`: re-check `canUploadBuild` with detected `expectedSize`; abort before calling ingest processing.
- [ ] **Download token issuance (iOS)** — `POST /builds/:id/ios/install-link`: call `canDownloadBuild`; refuse to mint manifest/download tokens when over transfer cap.
- [ ] **Manifest generation (iOS)** — `GET /builds/:id/ios/manifest`: before presigning S3 URL or returning local path, call `canDownloadBuild`; on deny, send structured error (no manifest/URL).
- [ ] **File delivery (iOS)** — `GET /builds/:id/ios/download`: re-check `canDownloadBuild` right before redirect/stream to avoid cached tokens bypassing updated quota.
- [ ] **Android/Wear download resolution** — `POST /resolve-install`: call `canDownloadBuild` before returning resolved download target; block if over transfer quota.
- [ ] **Download/install event logging** — `POST /builds/:id/downloads` and `/installs`: keep for analytics; do not replace gating but ensure events are recorded after a permitted download to track transfer usage.
- [ ] **Usage endpoints** — `/usage`, `/team-stats`: surface billing-relevant metrics (app count, builds, storage, download bytes) and mark when over limit to guide UI nudges.
- [ ] **Priority Support access** — wherever support entrypoints are exposed (UI/API hook): call `canUsePrioritySupport` before showing WhatsApp/email channel.
- [ ] **Enterprise-only toggles** — gate any future CI-heavy or unlimited features with `canAccessEnterpriseFeatures`.

---

## Download / Transfer Tracking Principles

- Counting rule: issuing a signed link or token is treated as a download event; also log on actual stream/redirect to avoid undercounting when tokens are unused.
- Quota check location: perform `canDownloadBuild` before **each** of (a) token issuance, (b) manifest creation, and (c) final file redirect/stream.
- Data recorded: build size in bytes and timestamp; aggregate per team per billing period to compare with plan transfer caps (1 GB Free, 10 GB Starter, 5 TB Team, 100 TB Enterprise).
- Signed link approach: current flow (iOS) issues short-lived tokens + optional Spaces presign; reuse this for Android when adding download endpoints. If a better signal is needed, also track HEAD/GET success to reduce false positives from abandoned links.
- When over quota: block and respond with `{ error: "transfer_limit_exceeded", upgrade_suggestion: true }`; do not issue URLs.

---

## Session Cache Guidance

- Cache Billing decisions in request context (e.g., Fastify request decorator) keyed by `(teamId, capability, argsHash)` for the request/session.
- Invalidate on subscription webhook events or on explicit `/billing/refresh` call from UI after plan change.
- Avoid persisting to long-lived cache; per-session or short TTL (≤5 minutes) is sufficient to reduce DB traffic without stale allowances.
