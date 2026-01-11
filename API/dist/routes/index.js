import { healthRoutes } from "./health.js";
import { infoRoutes } from "./info.js";
import { buildRoutes } from "./builds.js";
import { targetRoutes } from "./targets.js";
import { appRoutes } from "./apps.js";
import { versionRoutes } from "./versions.js";
import { variantRoutes } from "./variants.js";
import { moduleRoutes } from "./modules.js";
import { capabilityRoutes } from "./capabilities.js";
import { artifactRoutes } from "./artifacts.js";
import { resolveRoutes } from "./resolve.js";
import { storageRoutes } from "./storage.js";
import { pipelineRoutes } from "./pipeline.js";
import { authRoutes } from "./auth.js";
import { featureFlagRoutes } from "./featureFlags.js";
import { badgeRoutes } from "./badges.js";
import { realtimeRoutes } from "./realtime.js";
import { usageRoutes } from "./usage.js";
import { buildEventRoutes } from "./build-events.js";
import { iosInstallRoutes } from "./ios-install.js";
import { apiKeyRoutes } from "./api-keys.js";
import { teamStatsRoutes } from "./team-stats.js";
import { settingsRoutes } from "./settings.js";
import { registerTeamRoutes, registerUserTeamSettingsRoutes } from "@rafiki270/teams";
import { prisma } from "../lib/prisma.js";
import { loadConfig } from "../lib/config.js";
import { requireAuth, requireTeam } from "../auth/guard.js";
import { privateApiPlugins } from "../private/registry.js";
export async function registerRoutes(app) {
    const config = loadConfig();
    await app.register(healthRoutes);
    await app.register(infoRoutes);
    await app.register(buildRoutes);
    await app.register(targetRoutes);
    await app.register(appRoutes);
    await app.register(versionRoutes);
    await app.register(variantRoutes);
    await app.register(moduleRoutes);
    await app.register(capabilityRoutes);
    await app.register(artifactRoutes);
    await app.register(resolveRoutes);
    await app.register(storageRoutes);
    await app.register(pipelineRoutes);
    await app.register(badgeRoutes);
    await app.register(realtimeRoutes);
    await app.register(authRoutes);
    await app.register(featureFlagRoutes);
    await registerTeamRoutes(app, {
        prisma,
        inboundEmailDomain: config.INBOUND_EMAIL_DOMAIN,
        requireAuth,
    });
    await registerUserTeamSettingsRoutes(app, { prisma, requireAuth });
    await app.register(teamStatsRoutes);
    await app.register(usageRoutes);
    await app.register(buildEventRoutes);
    await app.register(iosInstallRoutes);
    await app.register(apiKeyRoutes);
    await app.register(settingsRoutes);
    for (const plugin of privateApiPlugins) {
        if (typeof plugin.register !== "function")
            continue;
        await plugin.register(app, { prisma, requireAuth, requireTeam });
    }
}
