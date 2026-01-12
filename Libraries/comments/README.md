# @rafiki270/comments

Reusable comments module for Einstore services. Supports attaching comments to any resource identified by a GUID (`parentId`) with a `category` (e.g., `build`, `app`, `article`). Includes simple fetch-based helpers and shared types.

## Installation

```bash
npm install @rafiki270/comments
```

## Usage

```ts
import { createCommentsClient } from "@rafiki270/comments";

const comments = createCommentsClient({
  baseUrl: "https://api.einstore.pro",
  getAccessToken: () => localStorage.getItem("accessToken"),
  getTeamId: () => localStorage.getItem("activeTeamId"),
});

// List
const list = await comments.list({ parentId: "build-guid", category: "build" });

// Create
await comments.create({ parentId: "build-guid", category: "build", text: "Looks good" });
```

The client automatically adds the `Authorization` bearer token when `getAccessToken` returns one and sets `x-team-id` from `getTeamId` when present.

## API

- `list({ parentId, category, page?, perPage? })` → `{ items, page, perPage, total, totalPages }`
- `create({ parentId, category, text })` → created comment record

### Types

- `Comment` – shape of a comment (id, parentId, category, text, user info, timestamps).
- `Paginated<T>` – helper pagination response shape.

## Development

- Keep files under 500 lines.
- Update `CHANGELOG.md` and bump the version when publishing.
- Tests/examples are encouraged for new behavior.
