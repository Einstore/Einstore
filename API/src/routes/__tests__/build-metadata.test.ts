import Fastify from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const prismaMock = vi.hoisted(() => ({
  build: { findFirst: vi.fn() },
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

const { registerRoutes } = await import("../index.js");

describe("GET /builds/:id/metadata", () => {
  const app = Fastify();

  beforeAll(async () => {
    await registerRoutes(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    const now = new Date("2024-01-01T00:00:00Z");
    prismaMock.build.findFirst.mockResolvedValue({
      id: "build-1",
      versionId: "version-1",
      buildNumber: "1",
      displayName: "Test Build",
      storageKind: "local",
      storagePath: "/tmp/app.ipa",
      sizeBytes: 123,
      createdAt: now,
      updatedAt: now,
      version: {
        id: "version-1",
        version: "1.0.0",
        app: {
          id: "app-1",
          identifier: "com.example.app",
          name: "Example App",
          teamId: "team-1",
        },
      },
      targets: [],
      artifacts: [
        {
          id: "artifact-1",
          buildId: "build-1",
          kind: "entitlements",
          label: null,
          metadata: { distribution: { kind: "adhoc", reason: "provisioned_devices_present" } },
          storageKind: "local",
          storagePath: "/tmp/app.ipa",
          createdAt: now,
          updatedAt: now,
        },
      ],
      signing: null,
    });
  });

  it("returns grouped artifacts and version context", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/builds/build-1/metadata",
      headers: { "x-team-id": "team-1" },
    });
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.artifactsByKind.entitlements[0].kind).toBe("entitlements");
    expect(payload.version.app.identifier).toBe("com.example.app");
  });
});
