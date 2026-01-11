import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";

const prismaMock = vi.hoisted(() => ({
  siteSetting: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../../auth/guard.js", () => ({
  requireAuth: async (request: { auth?: { user?: { id: string } } }) => {
    request.auth = { user: { id: "user-1" } };
  },
  requireSuperUser: async (request: { auth?: { user?: { id: string } } }) => {
    request.auth = { user: { id: "user-1" } };
  },
}));

const { settingsRoutes } = await import("../settings.js");

describe("settingsRoutes", () => {
  const app = Fastify();

  beforeAll(async () => {
    await app.register(settingsRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the stored analytics key", async () => {
    prismaMock.siteSetting.findUnique.mockResolvedValue({
      key: "analytics.gaMeasurementId",
      value: { gaMeasurementId: "G-TESTKEY123" },
    });

    const response = await app.inject({
      method: "GET",
      url: "/settings/analytics",
      headers: { authorization: "Bearer token" },
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.gaMeasurementId).toBe("G-TESTKEY123");
    expect(prismaMock.siteSetting.findUnique).toHaveBeenCalled();
  });

  it("rejects invalid analytics keys", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/settings/analytics",
      headers: { authorization: "Bearer token", "content-type": "application/json" },
      payload: { gaMeasurementId: "invalid" },
    });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.siteSetting.upsert).not.toHaveBeenCalled();
  });

  it("saves a valid analytics key", async () => {
    prismaMock.siteSetting.upsert.mockResolvedValue({
      key: "analytics.gaMeasurementId",
      value: { gaMeasurementId: "G-VALID1234" },
    });

    const response = await app.inject({
      method: "PUT",
      url: "/settings/analytics",
      headers: { authorization: "Bearer token", "content-type": "application/json" },
      payload: { gaMeasurementId: "G-VALID1234" },
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.gaMeasurementId).toBe("G-VALID1234");
    expect(prismaMock.siteSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "analytics.gaMeasurementId" },
        create: { key: "analytics.gaMeasurementId", value: { gaMeasurementId: "G-VALID1234" } },
        update: { value: { gaMeasurementId: "G-VALID1234" } },
      })
    );
  });
});
