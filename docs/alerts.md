# Admin Alerts Library

Reusable alert system for the Admin UI.

## Setup
Alerts are already wired in `Admin/src/App.tsx` via `AlertsProvider`.

## Usage
Import the hook and push alerts from anywhere in the Admin app:

```tsx
import { useAlerts } from "../lib/alerts";

const Example = () => {
  const { pushAlert } = useAlerts();

  const handleSave = () => {
    pushAlert({
      kind: "ok",
      message: "Saved successfully.",
    });
  };

  return <button onClick={handleSave}>Save</button>;
};
```

## Options
- `kind`: `"info" | "ok" | "alert" | "danger"`.
- `message`: main alert text (required).
- `title`: optional small label above the message.
- `durationMs`: how long to show the alert in milliseconds.
  - Default: `5000`.
  - Set to `0` to keep the alert on screen until clicked.

## Behavior
- New alerts appear at the top and push older ones downward.
- Clicking any alert dismisses it immediately.
