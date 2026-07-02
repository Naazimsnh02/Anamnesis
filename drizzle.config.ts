import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// `npx drizzle-kit generate` works without a live DB connection (reads
// schema.ts only). `npx drizzle-kit push`/`migrate` need POSTGRES_URL or
// DATABASE_URL set — see .env.local once Phase 5's DB is provisioned.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "",
  },
});
