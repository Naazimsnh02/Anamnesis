import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

// Reads a standard Postgres connection string so this works unmodified
// against Vercel Postgres, Neon, or a self-managed instance — no
// provider-specific SDK. Vercel Postgres/Neon both inject POSTGRES_URL;
// DATABASE_URL is the common fallback name for everything else.
const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "POSTGRES_URL (or DATABASE_URL) is not set — see Docs/Implementation-Plan.md Phase 5 for provisioning."
  );
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
