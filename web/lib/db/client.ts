import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

let pool: Pool | null = null;

export function getDatabaseUrl(): string | null {
  return process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL ?? null;
}

export function hasDatabaseConfig(): boolean {
  return getDatabaseUrl() !== null;
}

export function getDb() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString });
  }

  return drizzle(pool, { schema });
}
