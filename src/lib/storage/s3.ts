import "server-only";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { assertSafeKey, type StorageDriver } from "./types";

type Options = {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicBaseUrl: string;
};

/** Any S3-compatible object store (AWS S3, Cloudflare R2, Backblaze B2, MinIO). */
export class S3Storage implements StorageDriver {
  private client: S3Client;

  constructor(private opts: Options) {
    this.client = new S3Client({
      region: opts.region,
      endpoint: opts.endpoint,
      forcePathStyle: !!opts.endpoint,
      credentials:
        opts.accessKeyId && opts.secretAccessKey
          ? { accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey }
          : undefined,
    });
  }

  async put(key: string, body: Buffer, contentType: string) {
    assertSafeKey(key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.opts.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Keys are content-unique, so objects can be cached forever.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  async delete(keys: string[]) {
    if (!keys.length) return;
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.opts.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }

  url(key: string) {
    return `${this.opts.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }
}
