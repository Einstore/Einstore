import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const configSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.string().default("development"),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(): AppConfig {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid configuration: ${issues}`);
  }
  return parsed.data;
}
