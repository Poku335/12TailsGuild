import { Pool } from "pg";

let pool: Pool | null = null;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return pool;
}
