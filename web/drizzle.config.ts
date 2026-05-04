import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const connectionString =
  process.env.SUPABASE_DB_URL ??
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/postgres";

if (
  process.argv.some((arg) => arg.includes("migrate")) &&
  !process.env.SUPABASE_DB_URL &&
  !process.env.DATABASE_URL
) {
  throw new Error("Missing SUPABASE_DB_URL or DATABASE_URL for db:migrate.");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString
  }
});
