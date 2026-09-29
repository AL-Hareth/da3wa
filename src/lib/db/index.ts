import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    prepare: process.env.DATABASE_PREPARE !== "false",
  });
  return drizzle(client, { schema });
}

export type DB = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

declare global {
  var __da3wa_db: DB | undefined;
}

function getDb(): DB {
  // Reused across hot reloads in development so connections aren't leaked.
  const instance = globalThis.__da3wa_db ?? createDb();
  globalThis.__da3wa_db = instance;
  return instance;
}

/**
 * Connected on first use rather than at import time, so `next build` (which
 * evaluates route modules) works without DATABASE_URL, e.g. inside Docker.
 */
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
