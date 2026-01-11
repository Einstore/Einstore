import { describe, expect, it, vi } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";

const prismaMock = {
  user: { findUnique: vi.fn() },
  teamMember: { findUnique: vi.fn() },
};

const authServiceMock = {
  getSession: vi.fn(),
};

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../service.js", () => ({
  authService: authServiceMock,
}));

const { requireTeam } = await import("../guard.js");

const makeReply = () => {
  const reply: Partial<FastifyReply> & { sent?: boolean; statusCode?: number; payload?: unknown } =
    {};
  reply.status = (code: number) => {
    reply.statusCode = code;
    return reply as FastifyReply;
  };
  reply.send = (payload: unknown) => {
    reply.payload = payload;
    reply.sent = true;
    return reply as FastifyReply;
  };
  return reply as FastifyReply & { sent?: boolean; statusCode?: number; payload?: unknown };
};

describe("requireTeam", () => {
  it("accepts explicit team header membership", async () => {
    authServiceMock.getSession.mockResolvedValue({
      userId: "user-1",
      username: "tester",
      status: "active",
    });
    prismaMock.teamMember.findUnique.mockResolvedValue({
      teamId: "team-1",
      userId: "user-1",
      team: { id: "team-1" },
    });

    const request = {
      headers: { authorization: "Bearer token", "x-team-id": "team-1" },
    } as unknown as FastifyRequest;
    const reply = makeReply();

    await requireTeam(request, reply);

    expect(reply.sent).not.toBe(true);
    expect(request.team?.id).toBe("team-1");
  });

  it("falls back to lastActiveTeamId", async () => {
    authServiceMock.getSession.mockResolvedValue({
      userId: "user-2",
      username: "tester2",
      status: "active",
    });
    prismaMock.user.findUnique.mockResolvedValue({ lastActiveTeamId: "team-2" });
    prismaMock.teamMember.findUnique.mockResolvedValue({
      teamId: "team-2",
      userId: "user-2",
      team: { id: "team-2" },
    });

    const request = {
      headers: { authorization: "Bearer token" },
    } as unknown as FastifyRequest;
    const reply = makeReply();

    await requireTeam(request, reply);

    expect(reply.sent).not.toBe(true);
    expect(request.team?.id).toBe("team-2");
  });

  it("rejects missing team context", async () => {
    authServiceMock.getSession.mockResolvedValue({
      userId: "user-3",
      username: "tester3",
      status: "active",
    });
    prismaMock.user.findUnique.mockResolvedValue({ lastActiveTeamId: null });

    const request = {
      headers: { authorization: "Bearer token" },
    } as unknown as FastifyRequest;
    const reply = makeReply();

    await requireTeam(request, reply);

    expect(reply.statusCode).toBe(403);
    expect(reply.payload).toMatchObject({ error: "team_required" });
  });
});
