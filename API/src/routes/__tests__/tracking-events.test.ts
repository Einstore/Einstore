import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma.js", () => {
  const prisma = {
    build: {
      findFirst: vi.fn(),
    },
    target: {
      findFirst: vi.fn(),
    },
    trackingEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { prisma };
});

vi.mock("../../auth/guard.js", () => ({
  requireTeam: async (request: { auth?: { user?: { id: string } }; team?: { id: string } }) => {
    request.auth = { user: { id: "user-1" } };
    request.team = { id: "team-1" };
  },
}));

vi.mock("../../lib/team-access.js", () => ({
  requireBuildForTeam: async () => ({ id: "build-1" }),
}));

import { prisma as prismaMock } from "../../lib/prisma.js";
import { trackingEventRoutes } from "../tracking-events.js";

describe("trackingEventRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.build.findFirst.mockResolvedValue({ id: "build-1" });
    prismaMock.target.findFirst.mockResolvedValue({ buildId: "build-1" });
    prismaMock.$transaction.mockImplementation(async (operations: any[]) => Promise.all(operations));
  });

  it("creates tracking events per service", async () => {
    const created: any[] = [];
    prismaMock.trackingEvent.create.mockImplementation(async ({ data }: any) => {
      const record = { id: `evt-${created.length + 1}`, ...data };
      created.push(record);
      return record;
    });

    const app = Fastify();
    await app.register(trackingEventRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/builds/build-1/events",
      payload: {
        platform: "ios",
        deviceId: "device-123",
        metadata: {
          services: ["analytics", "errors", "usage", "crashes"],
          analytics: {
            event: { name: "app_launch", properties: { screen: "home" } },
            userProperties: { plan: "pro" },
            session: { id: "sess-1", startedAt: "2024-01-01T00:00:00.000Z", durationMs: 120000 },
          },
          errors: { message: "oops", stackTrace: "stack", properties: { code: "E123" } },
          crash: {
            exceptionType: "SIGABRT",
            stackTrace: "crash stack",
            occurredAt: "2024-01-02T00:00:00.000Z",
            appVersion: "1.0.0",
            buildNumber: "2",
            binaryHash: "abc",
          },
          usage: { timestamp: "2024-01-01T00:00:00.000Z", timeZone: "UTC", locale: "en-US" },
          custom: { env: "staging" },
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json() as { items: any[] };
    expect(body.items).toHaveLength(4);
    expect(created.map((row) => row.service)).toEqual(["analytics", "errors", "usage", "crashes"]);
    const crash = created.find((c) => c.service === "crashes");
    expect(crash?.binaryHash).toBe("abc");
  });

  it("resolves build by target when build id is not provided", async () => {
    const created: any[] = [];
    prismaMock.trackingEvent.create.mockImplementation(async ({ data }: any) => {
      const record = { id: `evt-${created.length + 1}`, ...data };
      created.push(record);
      return record;
    });

    const app = Fastify();
    await app.register(trackingEventRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/tracking/events",
      payload: {
        platform: "ios",
        targetId: "com.example.app",
        metadata: {
          services: ["distribution"],
          distribution: { buildNumber: "123", appVersion: "1.0.0" },
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(prismaMock.target.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bundleId: "com.example.app",
        }),
      }),
    );
    expect(created).toHaveLength(1);
    expect(created[0].buildId).toBe("build-1");
  });

  it("lists tracking events with pagination", async () => {
    prismaMock.trackingEvent.findMany.mockResolvedValue([{ id: "evt-1", service: "analytics" }]);
    prismaMock.trackingEvent.count.mockResolvedValue(1);

    const app = Fastify();
    await app.register(trackingEventRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/builds/build-1/events?service=analytics&page=1&perPage=10",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { items: any[]; page: number; perPage: number; total: number; totalPages: number };
    expect(body.items).toHaveLength(1);
    expect(body.page).toBe(1);
    expect(body.perPage).toBe(10);
    expect(body.total).toBe(1);
    expect(body.totalPages).toBe(1);
    expect(prismaMock.trackingEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ service: "analytics" }),
        take: 10,
      }),
    );
  });
});
