import Fastify from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  app: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  version: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  build: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  target: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  variant: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  module: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  capability: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  complianceArtifact: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  featureFlag: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  featureFlagOverride: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../../auth/guard.js", () => ({
  requireAuth: async () => undefined,
}));

const authServiceMock = {
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
};

vi.mock("../../auth/service.js", () => ({
  authService: authServiceMock,
}));

const ingestAndroidMock = vi.fn();
const ingestIosMock = vi.fn();

vi.mock("../../lib/ingest/android.js", () => ({
  ingestAndroidApk: ingestAndroidMock,
}));

vi.mock("../../lib/ingest/ios.js", () => ({
  ingestIosIpa: ingestIosMock,
}));

const resolveAndroidMock = vi.fn();

vi.mock("../../lib/resolve/android.js", () => ({
  resolveAndroidInstall: resolveAndroidMock,
}));

const ensureFeatureFlagMock = vi.fn();
const isFeatureFlagEnabledMock = vi.fn();

vi.mock("@rafiki270/feature-flags", () => ({
  ensureFeatureFlag: ensureFeatureFlagMock,
  isFeatureFlagEnabled: isFeatureFlagEnabledMock,
}));

const { registerRoutes } = await import("../index.js");

describe("routes", () => {
  const app = Fastify({ logger: false });
  const ids = {
    appId: "11111111-1111-1111-1111-111111111111",
    versionId: "22222222-2222-2222-2222-222222222222",
    buildId: "33333333-3333-3333-3333-333333333333",
    targetId: "44444444-4444-4444-4444-444444444444",
  };
  const postJson = (url: string, payload: unknown, headers: Record<string, string> = {}) =>
    app.inject({
      method: "POST",
      url,
      payload,
      headers: { "content-type": "application/json", ...headers },
    });

  beforeAll(async () => {
    await registerRoutes(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    authServiceMock.register.mockResolvedValue({ user: { id: "user-1" }, session: {} });
    authServiceMock.login.mockResolvedValue({ user: { id: "user-1" }, session: { accessToken: "token" } });
    authServiceMock.refresh.mockResolvedValue({ session: { accessToken: "token", refreshToken: "refresh" } });
    authServiceMock.logout.mockResolvedValue({ revoked: true });
    authServiceMock.getSession.mockResolvedValue({ user: { id: "user-1" } });
    authServiceMock.requestPasswordReset.mockResolvedValue({ token: "reset-token" });
    authServiceMock.resetPassword.mockResolvedValue({ status: "ok" });
    authServiceMock.oauthStart.mockResolvedValue({ authorizeUrl: "https://example.com/auth" });
    authServiceMock.oauthCallback.mockResolvedValue({
      status: "redirect",
      redirectUrl: "https://admin.local/login?authCode=oauth-code",
    });
    authServiceMock.oauthExchange.mockResolvedValue({ session: { accessToken: "token", refreshToken: "refresh" } });

    prismaMock.app.create.mockResolvedValue({ id: ids.appId });
    prismaMock.app.findMany.mockResolvedValue([{ id: ids.appId }]);
    prismaMock.app.findUnique.mockResolvedValue({ id: ids.appId });
    prismaMock.app.upsert.mockResolvedValue({ id: ids.appId });

    prismaMock.version.create.mockResolvedValue({ id: ids.versionId });
    prismaMock.version.findMany.mockResolvedValue([{ id: ids.versionId }]);
    prismaMock.version.findUnique.mockResolvedValue({ id: ids.versionId });
    prismaMock.version.upsert.mockResolvedValue({ id: ids.versionId });

    prismaMock.build.create.mockResolvedValue({ id: ids.buildId });
    prismaMock.build.findMany.mockResolvedValue([{ id: ids.buildId }]);
    prismaMock.build.findUnique.mockResolvedValue({ id: ids.buildId });

    prismaMock.target.create.mockResolvedValue({ id: ids.targetId });
    prismaMock.target.findMany.mockResolvedValue([{ id: ids.targetId }]);

    prismaMock.variant.create.mockResolvedValue({ id: "variant-1" });
    prismaMock.variant.findMany.mockResolvedValue([{ id: "variant-1" }]);

    prismaMock.module.create.mockResolvedValue({ id: "module-1" });
    prismaMock.module.findMany.mockResolvedValue([{ id: "module-1" }]);

    prismaMock.capability.create.mockResolvedValue({ id: "capability-1" });
    prismaMock.capability.findMany.mockResolvedValue([{ id: "capability-1" }]);

    prismaMock.complianceArtifact.create.mockResolvedValue({ id: "artifact-1" });
    prismaMock.complianceArtifact.findMany.mockResolvedValue([{ id: "artifact-1" }]);

    ingestAndroidMock.mockResolvedValue({ buildId: "build-android" });
    ingestIosMock.mockResolvedValue({ buildId: "build-ios" });
    resolveAndroidMock.mockResolvedValue({ status: "resolved" });

    prismaMock.featureFlag.create.mockResolvedValue({ id: "flag-1", key: "beta.feature" });
    prismaMock.featureFlag.findMany.mockResolvedValue([{ id: "flag-1", key: "beta.feature" }]);
    prismaMock.featureFlag.findUnique.mockResolvedValue({ id: "flag-1", key: "beta.feature" });
    prismaMock.featureFlag.delete.mockResolvedValue({ id: "flag-1", key: "beta.feature" });
    prismaMock.featureFlag.update.mockResolvedValue({ id: "flag-1", key: "beta.feature", defaultEnabled: true });

    prismaMock.featureFlagOverride.findFirst.mockResolvedValue(null);
    prismaMock.featureFlagOverride.create.mockResolvedValue({ id: "override-1", enabled: true });
    prismaMock.featureFlagOverride.findMany.mockResolvedValue([{ id: "override-1" }]);
    prismaMock.featureFlagOverride.update.mockResolvedValue({ id: "override-1", enabled: true });

    ensureFeatureFlagMock.mockResolvedValue({ id: "flag-1", key: "beta.feature" });
    isFeatureFlagEnabledMock.mockResolvedValue(true);
  });

  it("GET /health", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
  });

  it("GET /info", async () => {
    const response = await app.inject({ method: "GET", url: "/info" });
    expect(response.statusCode).toBe(200);
  });

  it("GET/POST /storage", async () => {
    const getResponse = await app.inject({ method: "GET", url: "/storage" });
    expect(getResponse.statusCode).toBe(200);
    const postResponse = await postJson("/storage", { kind: "local" });
    expect(postResponse.statusCode).toBe(200);
  });

  it("auth endpoints", async () => {
    const registerResponse = await postJson("/auth/register", {
      username: "tester",
      password: "password123",
      email: "tester@example.com",
    });
    expect(registerResponse.statusCode).toBe(201);
    const loginResponse = await postJson("/auth/login", {
      identifier: "tester",
      password: "password123",
    });
    expect(loginResponse.statusCode).toBe(200);
    const refreshResponse = await postJson("/auth/refresh", { refreshToken: "refresh" });
    expect(refreshResponse.statusCode).toBe(200);
    const sessionResponse = await app.inject({
      method: "GET",
      url: "/auth/session",
      headers: { authorization: "Bearer token" },
    });
    expect(sessionResponse.statusCode).toBe(200);
    const resetRequest = await postJson("/auth/password-reset", { email: "tester@example.com" });
    expect(resetRequest.statusCode).toBe(200);
    const resetConfirm = await postJson("/auth/password-reset/confirm", {
      token: "reset-token",
      newPassword: "newpassword123",
    });
    expect(resetConfirm.statusCode).toBe(200);
    const logoutResponse = await postJson("/auth/logout", { refreshToken: "refresh" });
    expect(logoutResponse.statusCode).toBe(200);
    const oauthStartResponse = await app.inject({
      method: "GET",
      url: "/auth/oauth/google/start?redirectUri=http://api.local/cb&successRedirect=http://app.local/login&failureRedirect=http://app.local/login",
    });
    expect(oauthStartResponse.statusCode).toBe(200);
    const oauthCallbackResponse = await app.inject({
      method: "GET",
      url: "/auth/oauth/google/callback?state=state&code=code",
    });
    expect(oauthCallbackResponse.statusCode).toBe(302);
    const oauthExchangeResponse = await postJson("/auth/oauth/exchange", { authCode: "oauth-code" });
    expect(oauthExchangeResponse.statusCode).toBe(200);
  });

  it("apps endpoints", async () => {
    const createResponse = await postJson("/apps", {
      name: "Test App",
      identifier: "com.example.app",
    });
    expect(createResponse.statusCode).toBe(201);
    const listResponse = await app.inject({ method: "GET", url: "/apps" });
    expect(listResponse.statusCode).toBe(200);
    const getResponse = await app.inject({ method: "GET", url: `/apps/${ids.appId}` });
    expect(getResponse.statusCode).toBe(200);
  });

  it("versions endpoints", async () => {
    const createResponse = await postJson("/versions", { appId: ids.appId, version: "1.0.0" });
    expect(createResponse.statusCode).toBe(201);
    const listResponse = await app.inject({ method: "GET", url: `/versions?appId=${ids.appId}` });
    expect(listResponse.statusCode).toBe(200);
    const getResponse = await app.inject({ method: "GET", url: `/versions/${ids.versionId}` });
    expect(getResponse.statusCode).toBe(200);
  });

  it("builds endpoints", async () => {
    const createResponse = await postJson("/builds", {
      appIdentifier: "com.example.app",
      appName: "Test App",
      version: "1.0.0",
      buildNumber: "1",
      displayName: "Test App",
      storageKind: "local",
      storagePath: "/tmp/app.bin",
      sizeBytes: 1024,
    });
    expect(createResponse.statusCode).toBe(201);
    const listResponse = await app.inject({ method: "GET", url: `/builds?appId=${ids.appId}` });
    expect(listResponse.statusCode).toBe(200);
    const getResponse = await app.inject({ method: "GET", url: `/builds/${ids.buildId}` });
    expect(getResponse.statusCode).toBe(200);
  });

  it("targets endpoints", async () => {
    const createResponse = await postJson("/targets", {
      buildId: ids.buildId,
      platform: "ios",
      role: "app",
      bundleId: "com.example.app",
    });
    expect(createResponse.statusCode).toBe(201);
    const listResponse = await app.inject({ method: "GET", url: `/targets?buildId=${ids.buildId}` });
    expect(listResponse.statusCode).toBe(200);
  });

  it("variants endpoints", async () => {
    const createResponse = await postJson("/variants", {
      buildId: ids.buildId,
      kind: "abi",
      key: "arm64",
      value: "arm64-v8a",
    });
    expect(createResponse.statusCode).toBe(201);
    const listResponse = await app.inject({ method: "GET", url: `/variants?buildId=${ids.buildId}` });
    expect(listResponse.statusCode).toBe(200);
  });

  it("modules endpoints", async () => {
    const createResponse = await postJson("/modules", {
      buildId: ids.buildId,
      name: "base",
      kind: "dynamic-feature",
      metadata: { enabled: true },
    });
    expect(createResponse.statusCode).toBe(201);
    const listResponse = await app.inject({ method: "GET", url: `/modules?buildId=${ids.buildId}` });
    expect(listResponse.statusCode).toBe(200);
  });

  it("capabilities endpoints", async () => {
    const createResponse = await postJson("/capabilities", {
      targetId: ids.targetId,
      name: "push",
      metadata: { type: "aps" },
    });
    expect(createResponse.statusCode).toBe(201);
    const listResponse = await app.inject({
      method: "GET",
      url: `/capabilities?targetId=${ids.targetId}`,
    });
    expect(listResponse.statusCode).toBe(200);
  });

  it("artifacts endpoints", async () => {
    const createResponse = await postJson("/artifacts", {
      buildId: ids.buildId,
      kind: "manifest",
      storageKind: "local",
      storagePath: "/tmp/manifest.json",
    });
    expect(createResponse.statusCode).toBe(201);
    const listResponse = await app.inject({ method: "GET", url: `/artifacts?buildId=${ids.buildId}` });
    expect(listResponse.statusCode).toBe(200);
  });

  it("feature flags endpoints", async () => {
    const createResponse = await postJson("/feature-flags", {
      key: "beta.feature",
      defaultEnabled: false,
    });
    expect(createResponse.statusCode).toBe(201);
    const listResponse = await app.inject({ method: "GET", url: "/feature-flags" });
    expect(listResponse.statusCode).toBe(200);
    const getResponse = await app.inject({ method: "GET", url: "/feature-flags/beta.feature" });
    expect(getResponse.statusCode).toBe(200);
    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/feature-flags/beta.feature",
      payload: { defaultEnabled: true },
      headers: { "content-type": "application/json" },
    });
    expect(updateResponse.statusCode).toBe(200);
    const deleteResponse = await app.inject({ method: "DELETE", url: "/feature-flags/beta.feature" });
    expect(deleteResponse.statusCode).toBe(200);
    const overrideResponse = await postJson("/feature-flags/beta.feature/overrides", {
      scope: "platform",
      enabled: true,
    });
    expect(overrideResponse.statusCode).toBe(201);
    const overridesList = await app.inject({ method: "GET", url: "/feature-flags/beta.feature/overrides" });
    expect(overridesList.statusCode).toBe(200);
    const evaluateResponse = await app.inject({ method: "GET", url: "/feature-flags/beta.feature/evaluate" });
    expect(evaluateResponse.statusCode).toBe(200);
  });

  it("POST /resolve-install", async () => {
    const response = await postJson("/resolve-install", {
      buildId: ids.buildId,
      device: { platform: "ios", osVersion: "17.0" },
    });
    expect(response.statusCode).toBe(200);
  });

  it("POST /resolve-install (android)", async () => {
    const response = await postJson("/resolve-install", {
      buildId: ids.buildId,
      device: { platform: "android", osVersion: "34", abi: "arm64-v8a", density: "480" },
    });
    expect(response.statusCode).toBe(200);
  });

  it("POST /ingest (apk + ipa)", async () => {
    const apkResponse = await postJson("/ingest", { filePath: "/tmp/app.apk", kind: "apk" });
    expect(apkResponse.statusCode).toBe(201);
    const ipaResponse = await postJson("/ingest", { filePath: "/tmp/app.ipa", kind: "ipa" });
    expect(ipaResponse.statusCode).toBe(201);
  });
});
