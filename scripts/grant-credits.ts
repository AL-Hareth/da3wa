/**
 * Grants credits to a user's workspace (support / promotions / manual sales).
 *   pnpm credits:grant <email> <standard|premium> <amount> [note]
 */
import "dotenv/config";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";

async function main() {
  const [email, kind, amountRaw, ...noteParts] = process.argv.slice(2);
  const amount = Number(amountRaw);
  if (!email || (kind !== "standard" && kind !== "premium") || !Number.isInteger(amount) || amount === 0) {
    console.error("Usage: pnpm credits:grant <email> <standard|premium> <amount> [note]");
    process.exit(1);
  }
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema });
  try {
    const user = await db.query.user.findFirst({ where: eq(schema.user.email, email.toLowerCase()) });
    if (!user) throw new Error(`No user with email ${email}`);
    const member = await db.query.workspaceMember.findFirst({
      where: eq(schema.workspaceMember.userId, user.id),
      orderBy: asc(schema.workspaceMember.createdAt),
    });
    if (!member) throw new Error("User has no workspace yet (they must sign in once)");
    await db.insert(schema.creditLedger).values({
      workspaceId: member.workspaceId,
      kind,
      delta: amount,
      reason: amount > 0 ? "grant" : "adjustment",
      note: noteParts.join(" ") || null,
    });
    console.log(`Granted ${amount} ${kind} credit(s) to ${email}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
