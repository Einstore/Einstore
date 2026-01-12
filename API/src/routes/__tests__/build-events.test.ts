import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuildEventKind } from "@prisma/client";

vi.mock("../../lib/prisma.js", () => {
  const prisma = {
    buildEvent: {
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
import { buildEventRoutes } from "../build-events.js";

describe("buildEventRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (operations: any[]) => Promise.all(operations));
  });

  it("lists team build events with kind filter and build context", async () => {
    prismaMock.buildEvent.count.mockResolvedValue(2);
    prismaMock.buildEvent.findMany.mockResolvedValue([
      {
        id: "evt-1",
        kind: BuildEventKind.download,
        createdAt: "2024-02-01T00:00:00.000Z",
        buildId: "build-1",
        teamId: "team-1",
        user: { id: "user-1", username: "maya", email: "maya@einstore.dev", fullName: "Maya Singh" },
        build: {
          id: "build-1",
          buildNumber: "42",
          displayName: "Atlas Field 4.2.1",
          version: {
            id: "version-1",
            version: "4.2.1",
            app: { id: "app-1", name: "Atlas Field", identifier: "com.einstore.atlas" },
          },
        },
      },
      {
        id: "evt-2",
        kind: BuildEventKind.install,
        createdAt: "2024-02-02T00:00:00.000Z",
        buildId: "build-2",
        teamId: "team-1",
        user: { id: "user-2", username: "rafael", email: null, fullName: "Rafael Vega" },
        build: {
          id: "build-2",
          buildNumber: "10",
          displayName: "Pulse Monitor 3.8.0",
          version: {
            id: "version-2",
            version: "3.8.0",
            app: { id: "app-2", name: "Pulse Monitor", identifier: "com.einstore.pulse" },
          },
        },
      },
    ]);

    const app = Fastify();
    await app.register(buildEventRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/builds/events?perPage=5&kinds=download,install",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { items: any[]; page: number; perPage: number; total: number; totalPages: number };
    expect(body.items).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(prismaMock.buildEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ teamId: "team-1", kind: { in: ["download", "install"] } }),
        take: 5,
      }),
    );
    expect(body.items[0].build.displayName).toBe("Atlas Field 4.2.1");
    expect(body.items[1].user.fullName).toBe("Rafael Vega");
  });

  it("lists team build events without kind filter when kinds omitted", async () => {
    prismaMock.buildEvent.count.mockResolvedValue(1);
    prismaMock.buildEvent.findMany.mockResolvedValue([{ id: "evt-1", kind: BuildEventKind.download }]);

    const app = Fastify();
    await app.register(buildEventRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/builds/events?page=1&perPage=2",
    });

    expect(response.statusCode).toBe(200);
    expect(prismaMock.buildEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { teamId: "team-1" },
        skip: 0,
        take: 2,
      }),
    );
  });
});
