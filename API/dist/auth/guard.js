import { asAuthError } from "@unlikeother/auth";
import { authService } from "./service.js";
import { prisma } from "../lib/prisma.js";
import { resolveApiKeySecret, verifyApiKey } from "@rafiki270/api-keys";
export async function requireAuth(request, reply) {
    const header = request.headers["authorization"];
    if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
        return reply.status(401).send({ error: "token_invalid", message: "Missing access token" });
    }
    const token = header.replace("Bearer ", "").trim();
    try {
        const session = await authService.getSession(token);
        request.auth = {
            user: {
                id: session.userId,
                username: session.username,
                email: session.email ?? null,
                name: session.name ?? null,
                avatarUrl: session.avatarUrl ?? null,
                status: session.status,
            },
        };
    }
    catch (err) {
        const authErr = asAuthError(err, "token_invalid");
        return reply.status(401).send({ error: authErr.code, message: authErr.message });
    }
}
export async function requireSuperUser(request, reply) {
    await requireAuth(request, reply);
    if (reply.sent) {
        return;
    }
    const userId = request.auth?.user.id;
    if (!userId) {
        return reply.status(401).send({ error: "token_invalid", message: "Missing access token" });
    }
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperUser: true },
    });
    if (!user?.isSuperUser) {
        return reply
            .status(403)
            .send({ error: "forbidden", message: "Super user access required" });
    }
}
export async function requireTeam(request, reply) {
    await requireAuth(request, reply);
    if (reply.sent) {
        return;
    }
    const userId = request.auth?.user.id;
    if (!userId) {
        return reply.status(401).send({ error: "token_invalid", message: "Missing access token" });
    }
    const headerTeamId = request.headers["x-team-id"];
    const teamId = typeof headerTeamId === "string" && headerTeamId.trim()
        ? headerTeamId.trim()
        : (await prisma.user.findUnique({
            where: { id: userId },
            select: { lastActiveTeamId: true },
        }))?.lastActiveTeamId;
    if (!teamId) {
        return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
        include: { team: true },
    });
    if (!membership) {
        return reply.status(403).send({ error: "forbidden", message: "Team access denied" });
    }
    request.team = membership.team;
    request.teamMember = membership;
}
export async function requireTeamAdmin(request, reply) {
    await requireTeam(request, reply);
    if (reply.sent) {
        return;
    }
    const role = request.teamMember?.role;
    if (role !== "owner" && role !== "admin") {
        return reply.status(403).send({ error: "forbidden", message: "Admin access required" });
    }
}
export async function requireTeamOrApiKey(request, reply) {
    const apiKeyHeader = request.headers["x-api-key"];
    const queryToken = typeof request.query === "object" && request.query !== null && "token" in request.query
        ? request.query.token
        : undefined;
    const apiKeyToken = (typeof apiKeyHeader === "string" && apiKeyHeader.trim()) ||
        (typeof queryToken === "string" && queryToken.trim());
    if (apiKeyToken) {
        const secret = resolveApiKeySecret({
            env: process.env,
            fallbackEnvKeys: ["AUTH_JWT_SECRET"],
            defaultSecret: "dev-api-key-secret",
        });
        const { apiKey, error } = await verifyApiKey(prisma, apiKeyToken.trim(), {
            secret,
        });
        if (!apiKey || error === "api_key_invalid") {
            return reply
                .status(401)
                .send({ error: "api_key_invalid", message: "Invalid API key" });
        }
        if (error === "api_key_expired") {
            return reply
                .status(401)
                .send({ error: "api_key_expired", message: "API key expired" });
        }
        request.team = apiKey.team;
        request.apiKey = apiKey;
        return;
    }
    await requireTeam(request, reply);
}
