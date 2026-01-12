import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { searchRoutes } from "../search.js";

const prismaMock = vi.hoisted(() => ({
  app: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  build: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../../auth/guard.js", () => ({
  requireTeam: async (request: { team?: { id: string } }) => {
    request.team = { id: "team-1" };
  },
}));

describe("GET /search", () => {
  const app = Fastify();

  beforeAll(async () => {
    app.register(searchRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation((operations: unknown) => {
      if (Array.isArray(operations)) {
        return Promise.all(operations);
      }
      return operations;
    });
    prismaMock.app.count.mockResolvedValue(0);
    prismaMock.app.findMany.mockResolvedValue([]);
    prismaMock.build.count.mockResolvedValue(1);
    prismaMock.build.findMany.mockResolvedValue([
      {
        id: "build-1",
        buildNumber: "42",
        displayName: "Release Candidate",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        version: {
          version: "1.2.3",
          app: { id: "app-1", name: "SampleApp", identifier: "com.example.app" },
        },
      },
    ]);
  });

  it("matches builds by tag name (partial, case-insensitive)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/search?q=beta",
      headers: { "x-team-id": "team-1" },
    });
    expect(response.statusCode).toBe(200);
    const [countArgs] = prismaMock.build.count.mock.calls[0];
    expect(countArgs.where?.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          buildTags: {
            some: expect.objectContaining({
              OR: expect.arrayContaining([
                { tag: { normalizedName: "beta" } },
                { tag: { name: { contains: "beta", mode: "insensitive" } } },
              ]),
            }),
          },
        }),
      ])
    );
  });

  it("matches builds by version number substring", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/search?q=1.2",
      headers: { "x-team-id": "team-1" },
    });
    expect(response.statusCode).toBe(200);
    const [countArgs] = prismaMock.build.count.mock.calls[0];
    expect(countArgs.where?.OR).toEqual(
      expect.arrayContaining([{ version: { version: { contains: "1.2", mode: "insensitive" } } }])
    );
  });

  it("matches builds by mid-word display name substring", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/search?q=lease",
      headers: { "x-team-id": "team-1" },
    });
    expect(response.statusCode).toBe(200);
    const [countArgs] = prismaMock.build.count.mock.calls[0];
    expect(countArgs.where?.OR).toEqual(
      expect.arrayContaining([{ displayName: { contains: "lease", mode: "insensitive" } }])
    );
  });
});
