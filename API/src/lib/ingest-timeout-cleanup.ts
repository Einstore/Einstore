import { prisma } from "./prisma.js";
import { broadcastTeamEvent } from "./realtime.js";

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

type CleanupOptions = {
  teamId?: string | null;
  timeoutMs?: number;
};

export const failStaleIngestJobs = async (options: CleanupOptions = {}) => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const cutoff = new Date(Date.now() - timeoutMs);
  const where = {
    status: { in: ["queued", "processing"] as const },
    updatedAt: { lt: cutoff },
    ...(options.teamId ? { teamId: options.teamId } : {}),
  };
  const staleJobs = await prisma.ingestJob.findMany({
    where,
    select: { id: true, teamId: true },
  });
  for (const job of staleJobs) {
    await prisma.ingestJob.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: "processing_timeout" },
    });
    broadcastTeamEvent(job.teamId, {
      type: "ingest.failed",
      jobId: job.id,
      message: "processing_timeout",
    });
  }
  return staleJobs.length;
};

export const startIngestTimeoutCleanup = () => {
  let isRunning = false;
  const timer = setInterval(async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await failStaleIngestJobs();
    } catch (error) {
      console.warn("ingest-timeout-cleanup failed", error);
    } finally {
      isRunning = false;
    }
  }, DEFAULT_INTERVAL_MS);
  return () => clearInterval(timer);
};
