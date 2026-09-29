import "server-only";
import { env } from "../env";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";
import type { StorageDriver } from "./types";

export type { StorageDriver };

let driver: StorageDriver | undefined;

export function storage(): StorageDriver {
  if (driver) return driver;
  const e = env();
  if (e.STORAGE_DRIVER === "s3") {
    if (!e.S3_BUCKET || !e.S3_PUBLIC_BASE_URL) {
      throw new Error("S3 storage requires S3_BUCKET and S3_PUBLIC_BASE_URL");
    }
    driver = new S3Storage({
      bucket: e.S3_BUCKET,
      region: e.S3_REGION,
      endpoint: e.S3_ENDPOINT,
      accessKeyId: e.S3_ACCESS_KEY_ID,
      secretAccessKey: e.S3_SECRET_ACCESS_KEY,
      publicBaseUrl: e.S3_PUBLIC_BASE_URL,
    });
  } else {
    driver = new LocalStorage(e.STORAGE_LOCAL_DIR);
  }
  return driver;
}
