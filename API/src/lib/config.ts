import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const configSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.string().default("development"),
  INBOUND_EMAIL_DOMAIN: z.string().default("local.einstore"),
  CORS_ORIGINS: z.string().optional(),
  UPLOAD_MAX_BYTES: z.coerce.number().default(8 * 1024 * 1024 * 1024),
  INSTALL_BASE_URL: z.string().url().optional(),
  API_KEY_SECRET: z.string().min(1).optional(),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(): AppConfig {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid configuration: ${issues}`);
  }
  if (parsed.data.NODE_ENV === "production" && !parsed.data.API_KEY_SECRET) {
    throw new Error("Invalid configuration: API_KEY_SECRET is required in production.");
  }
  return parsed.data;
}
