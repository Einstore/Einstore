import fs from "node:fs";
import path from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { registerRoutes } from "../index.js";

const prismaMock = {
  build: { findFirst: vi.fn() },
  target: { findFirst: vi.fn() },
};

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../../auth/guard.js", () => ({
  requireTeam: async (request: { team?: { id: string }; auth?: { user?: { id: string } } }) => {
    request.team = { id: "team-1" };
    request.auth = { user: { id: "user-1" } };
  },
  requireAuth: async (request: { auth?: { user?: { id: string } } }) => {
    request.auth = { user: { id: "user-1" } };
  },
  requireSuperUser: async (request: { auth?: { user?: { id: string } } }) => {
    request.auth = { user: { id: "user-1" } };
  },
}));

vi.mock("@rafiki270/teams", () => ({
  registerTeamRoutes: async () => {},
  registerUserTeamSettingsRoutes: async () => {},
}));

vi.mock("../../lib/config.js", () => ({
  loadConfig: () => ({
    DATABASE_URL: "postgresql://test",
    PORT: 0,
    NODE_ENV: "test",
    INBOUND_EMAIL_DOMAIN: "local.einstore",
    CORS_ORIGINS: undefined,
    UPLOAD_MAX_BYTES: 0,
  }),
}));

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOaX2zQAAAAASUVORK5CYII=";

const storageRoot = path.resolve(process.cwd(), "storage", "ingest");

describe("GET /builds/:id/icons", () => {
  const app = Fastify();
  let iconDir = "";
  let iconPath = "";

  beforeAll(async () => {
    await registerRoutes(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    fs.mkdirSync(storageRoot, { recursive: true });
    iconDir = fs.mkdtempSync(path.join(storageRoot, "test-icon-"));
    iconPath = path.join(iconDir, "icon-1x1.png");
    fs.writeFileSync(iconPath, Buffer.from(PNG_BASE64, "base64"));

    prismaMock.build.findFirst.mockResolvedValue({
      id: "build-1",
      version: {
        app: { id: "app-1", teamId: "team-1", identifier: "com.example.app" },
      },
      targets: [
        {
          id: "target-1",
          bundleId: "com.example.app",
          platform: "ios",
          role: "app",
          metadata: { iconBitmap: { path: iconPath, width: 1, height: 1, sizeBytes: 68 } },
        },
      ],
    });

    prismaMock.target.findFirst.mockResolvedValue({
      id: "target-1",
      buildId: "build-1",
      metadata: { iconBitmap: { path: iconPath, width: 1, height: 1, sizeBytes: 68 } },
    });
  });

  afterEach(() => {
    if (iconDir) {
      fs.rmSync(iconDir, { recursive: true, force: true });
    }
  });

  it("returns icon metadata with URLs", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/builds/build-1/icons",
      headers: { "x-team-id": "team-1" },
    });
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].url).toContain("/builds/build-1/icons/target-1");
    expect(payload.items[0].dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("streams the icon image", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/builds/build-1/icons/target-1",
      headers: { "x-team-id": "team-1" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("image/png");
  });
});
