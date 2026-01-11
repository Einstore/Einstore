import { requireTeam } from "../auth/guard.js";
import { getTeamBadges } from "../lib/badges.js";
export async function badgeRoutes(app) {
    app.get("/badges", { preHandler: requireTeam }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const badges = await getTeamBadges(teamId);
        return reply.send({ badges });
    });
}
