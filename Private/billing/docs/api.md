# Billing API (Private Module)

This module handles Stripe Checkout flows and subscription changes for billing.

## Enforcement
When the private billing module is enabled, plan limits are enforced across core APIs:
- App and build caps: enforced during app creation and ingest/build creation.
- Storage caps: enforced during upload/ingest (returns `storage_limit_exceeded`, 413).
- Transfer caps: enforced for iOS download/manifest links (returns `transfer_limit_exceeded`, 403).
- User seats: enforced on team invite creation and invite acceptance (`seat_limit_exceeded`).
- Free plan anti-cheat: a user may only have one app across all free teams (`free_plan_app_limit`).

## Endpoints

### GET /billing/status
Returns current subscription state for the active team.

Response (example):
```json
{
  "planId": "team",
  "status": "active",
  "currentPeriodStart": 1736720000,
  "currentPeriodEnd": 1739312000,
  "cancelAtPeriodEnd": false,
  "pendingPlanId": null,
  "addOn": {
    "enabled": true,
    "status": "active",
    "currentPeriodEnd": 1739312000,
    "cancelAtPeriodEnd": false
  }
}
```

### POST /billing/checkout
Creates a Stripe Checkout session for a paid plan. Use this for new subscriptions.

Request:
```json
{
  "planId": "team",
  "successUrl": "https://admin.einstore.pro/billing?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://admin.einstore.pro/billing"
}
```

Response:
```json
{ "url": "https://checkout.stripe.com/...", "sessionId": "cs_..." }
```

### POST /billing/checkout/complete
Finalizes a completed Checkout session and stores the Stripe customer/subscription IDs.

Request:
```json
{ "sessionId": "cs_..." }
```

Response:
```json
{ "status": "ok" }
```

### POST /billing/plan
Changes an existing plan:
- Upgrade: immediate, charge now, old plan ends right away.
- Downgrade: scheduled at period end, no refunds.
- Free: cancels at period end.

Request:
```json
{ "planId": "enterprise" }
```

Response (examples):
```json
{ "status": "upgraded", "planId": "enterprise", "effectiveAt": 1736720000 }
```
```json
{ "status": "scheduled", "planId": "starter", "effectiveAt": 1739312000 }
```

### POST /billing/addon
Toggles the SLA add-on. When enabling, returns a Checkout URL (separate billing cycle).
Disabling schedules cancellation at period end.

Enable request:
```json
{
  "enabled": true,
  "successUrl": "https://admin.einstore.pro/billing?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://admin.einstore.pro/billing"
}
```

Disable request:
```json
{ "enabled": false }
```
