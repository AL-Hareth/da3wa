import "server-only";
import sharp, { type Metadata } from "sharp";
import type { ImageAsset } from "./db/schema";
import { newId, randomId } from "./ids";
import { storage } from "./storage";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const WIDTHS = [480, 960, 1440];

export class ImageError extends Error {
  constructor(public code: "too_large" | "unsupported" | "too_small" | "corrupt") {
    super(code);
  }
}

/**
 * Validates an uploaded image by decoding it (never trusting the extension or
 * MIME type), strips metadata, and stores responsive WebP variants plus a JPEG
 * for link previews.
 */
export async function processAndStoreImage(file: File, prefix: string): Promise<ImageAsset> {
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageError("too_large");
  const input = Buffer.from(await file.arrayBuffer());

  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 50_000_000 }).metadata();
  } catch {
    throw new ImageError("corrupt");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw new ImageError("unsupported");

  // Apply EXIF orientation once, then work from the normalized image.
  const base = sharp(input, { limitInputPixels: 50_000_000 }).rotate();
  const { data: normalized, info } = await base.toBuffer({ resolveWithObject: true });
  if (info.width < 200 || info.height < 200) throw new ImageError("too_small");

  const id = newId();
  const dir = `${prefix}/${id}-${randomId(6)}`;
  const widths = WIDTHS.filter((w) => w < info.width);
  widths.push(Math.min(info.width, 2000));

  const variants = await Promise.all(
    [...new Set(widths)].map(async (width) => {
      const buf = await sharp(normalized).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const key = `${dir}/${width}.webp`;
      await storage().put(key, buf, "image/webp");
      return { width, key };
    }),
  );

  // Link-preview crawlers (WhatsApp in particular) want a small JPEG, ideally < 300KB.
  const og = await sharp(normalized)
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  const ogKey = `${dir}/og.jpg`;
  await storage().put(ogKey, og, "image/jpeg");

  const blur = await sharp(normalized).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();

  return {
    id,
    width: info.width,
    height: info.height,
    variants: variants.sort((a, b) => a.width - b.width),
    ogKey,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

export async function deleteImage(asset: ImageAsset | null | undefined) {
  if (!asset) return;
  try {
    await storage().delete([...asset.variants.map((v) => v.key), asset.ogKey]);
  } catch (err) {
    console.error("[images] delete failed", err);
  }
}

export type ImageUrls = { src: string; thumb: string; srcSet: string; width: number; height: number; og: string; blurDataUrl: string };

export function imageUrls(asset: ImageAsset): ImageUrls {
  const s = storage();
  const largest = asset.variants[asset.variants.length - 1];
  return {
    src: s.url(largest.key),
    thumb: s.url(asset.variants[0].key),
    srcSet: asset.variants.map((v) => `${s.url(v.key)} ${v.width}w`).join(", "),
    width: asset.width,
    height: asset.height,
    og: s.url(asset.ogKey),
    blurDataUrl: asset.blurDataUrl,
  };
}
