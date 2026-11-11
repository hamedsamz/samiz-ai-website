import "server-only";
import { Pool } from "pg";

let pool: Pool | undefined;

export function academyPool() {
  const url = process.env.ACADEMY_DATABASE_URL;
  if (!url) throw new Error("Academy database is not configured");
  if (pool) return pool;
  pool = new Pool({
    connectionString: url,
    options: "-c search_path=academy",
    max: 3,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 10000,
    statement_timeout: 8000,
  });
  pool.on("error", () => console.error("Academy database connection dropped."));
  return pool;
}
