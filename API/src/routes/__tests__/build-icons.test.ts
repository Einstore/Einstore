import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
const prismaMock = vi.hoisted(() => ({
  build: { findFirst: vi.fn() },
  target: { findFirst: vi.fn() },
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../../auth/guard.js", () => ({
  requireTeam: async (request: { team?: { id: string }; auth?: { user?: { id: string } } }) => {
    request.team = { id: "team-1" };
    request.auth = { user: { id: "user-1" } };
  },
  requireTeamOrApiKey: async (
    request: { team?: { id: string }; auth?: { user?: { id: string } } },
  ) => {
    request.team = { id: "team-1" };
    request.auth = { user: { id: "user-1" } };
  },
  requireTeamAdmin: async (
    request: { team?: { id: string }; auth?: { user?: { id: string } } },
  ) => {
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
  registerTeamInviteRoutes: async () => {},
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

vi.mock("../../auth/service.js", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getSession: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
    oauthStart: vi.fn(),
    oauthCallback: vi.fn(),
    oauthExchange: vi.fn(),
  },
}));

const presignStorageObjectMock = vi.fn();

vi.mock("../../lib/storage-presign.js", () => ({
  presignStorageObject: presignStorageObjectMock,
}));

const { registerRoutes } = await import("../index.js");

describe("GET /builds/:id/icons", () => {
  const app = Fastify();
  let iconPath = "";

  beforeAll(async () => {
    await registerRoutes(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    iconPath = "spaces://einstore-local/icons/icon-1x1.png";
    presignStorageObjectMock.mockResolvedValue("https://storage.local/icon-1x1.png");

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

  it("returns icon metadata with URLs", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/builds/build-1/icons",
      headers: { "x-team-id": "team-1" },
    });
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].url).toBe("https://storage.local/icon-1x1.png");
    expect(payload.items[0].dataUrl).toBeUndefined();
  });

  it("redirects to the stored icon", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/builds/build-1/icons/target-1",
      headers: { "x-team-id": "team-1" },
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("https://storage.local/icon-1x1.png");
  });
});
