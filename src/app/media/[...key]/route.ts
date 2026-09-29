import { env } from "@/lib/env";
import { storage } from "@/lib/storage";
import { LocalStorage } from "@/lib/storage/local";

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

/** Serves files for the local storage driver. With S3 storage, files are served by the bucket/CDN. */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...key]">) {
  if (env().STORAGE_DRIVER !== "local") return new Response("Not found", { status: 404 });
  const { key } = await ctx.params;
  const path = key.join("/");
  const driver = storage();
  if (!(driver instanceof LocalStorage)) return new Response("Not found", { status: 404 });
  let data: Buffer | null = null;
  try {
    data = await driver.read(path);
  } catch {
    data = null;
  }
  if (!data) return new Response("Not found", { status: 404 });
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
