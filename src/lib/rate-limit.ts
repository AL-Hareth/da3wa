import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./db";

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: Date };

/**
 * Fixed-window rate limiter backed by Postgres so it holds across multiple app
 * instances without extra infrastructure. One atomic upsert per check.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const rows = await db.execute<{ count: number; reset_at: Date }>(sql`
    insert into rate_bucket (key, count, reset_at)
    values (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    on conflict (key) do update set
      count = case when rate_bucket.reset_at <= now() then 1 else rate_bucket.count + 1 end,
      reset_at = case when rate_bucket.reset_at <= now() then now() + make_interval(secs => ${windowSeconds}) else rate_bucket.reset_at end
    returning count, reset_at
  `);
  const row = rows[0];

  // Opportunistic cleanup of expired buckets (~1% of calls).
  if (Math.random() < 0.01) {
    void db.execute(sql`delete from rate_bucket where reset_at < now() - interval '1 day'`).catch(() => {});
  }

  return { ok: row.count <= limit, remaining: Math.max(0, limit - row.count), resetAt: new Date(row.reset_at) };
}
