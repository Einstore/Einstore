import { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { requireTeam } from "../auth/guard.js";
import { resolveS3Client } from "../lib/storage-presign.js";

const LOGO_DIR = path.resolve(process.cwd(), "storage", "team-logos");
const MAX_BYTES = 2 * 1024 * 1024;

const ensureDir = async () => {
  await fs.promises.mkdir(LOGO_DIR, { recursive: true });
};

const saveLocal = async (teamId: string, buffer: Buffer) => {
  await ensureDir();
  const filePath = path.join(LOGO_DIR, `${teamId}.png`);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
};

const uploadToSpaces = async (teamId: string, buffer: Buffer) => {
  const bucket = process.env.SPACES_BUCKET;
  if (!bucket) return null;
  const client = resolveS3Client();
  if (!client) return null;
  const key = `team-logos/${teamId}.png`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
      ACL: "public-read",
    })
  );
  const endpoint = process.env.SPACES_ENDPOINT;
  const base =
    process.env.SPACES_PUBLIC_URL ||
    (endpoint
      ? `${endpoint.replace(/^https?:\/\//, "")}`
      : `${bucket}.nyc3.digitaloceanspaces.com`);
  const protocol = endpoint?.startsWith("https://") ? "https://" : "https://";
  return `${protocol}${base}/${key}`;
};

export async function teamLogoRoutes(app: FastifyInstance) {
  app.post("/teams/logo", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    let file;
    try {
      file = await request.file({ limits: { fileSize: MAX_BYTES, files: 1 } });
    } catch (error) {
      if ((error as { code?: string }).code === "FST_ERR_CTP_INVALID_CONTENT_LENGTH") {
        return reply
          .status(400)
          .send({ error: "content_length_mismatch", message: "Content-Length did not match body size." });
      }
      throw error;
    }
    if (!file) {
      return reply.status(400).send({ error: "file_required", message: "Logo file is required." });
    }
    const buffer = await file.toBuffer();
    if (buffer.length > MAX_BYTES) {
      return reply.status(400).send({ error: "file_too_large", message: "Max size is 2MB." });
    }
    const resized = await sharp(buffer).resize(180, 180, { fit: "cover" }).png({ quality: 90 }).toBuffer();

    let url: string | null = null;
    const spacesUrl = await uploadToSpaces(teamId, resized).catch(() => null);
    if (spacesUrl) {
      url = spacesUrl;
    } else {
      await saveLocal(teamId, resized);
      url = `/teams/${teamId}/logo`;
    }

    return reply.send({ url });
  });

  app.get("/teams/logo", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    return reply.redirect(`/teams/${teamId}/logo`);
  });

  app.get("/teams/:id/logo", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!id) {
      return reply.status(400).send({ error: "team_required" });
    }

    const bucket = process.env.SPACES_BUCKET;
    const client = resolveS3Client();
    if (bucket && client) {
      const key = `team-logos/${id}.png`;
      try {
        const signed = await getSignedUrl(
          client,
          new GetObjectCommand({ Bucket: bucket, Key: key }),
          { expiresIn: 60 }
        );
        return reply.redirect(signed);
      } catch {
        // fall through to local
      }
    }

    const filePath = path.join(LOGO_DIR, `${id}.png`);
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: "not_found" });
    }
    reply.header("Content-Type", "image/png");
    return reply.send(fs.createReadStream(filePath));
  });
}
