import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertSafeKey, type StorageDriver } from "./types";

/** Stores files on local disk; served by the /media route. Suitable for single-node deployments. */
export class LocalStorage implements StorageDriver {
  private root: string;

  constructor(dir: string) {
    this.root = path.resolve(dir);
  }

  private resolve(key: string) {
    assertSafeKey(key);
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error("Invalid storage key");
    return full;
  }

  async put(key: string, body: Buffer) {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  async delete(keys: string[]) {
    await Promise.all(keys.map((k) => rm(this.resolve(k), { force: true })));
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolve(key));
    } catch {
      return null;
    }
  }

  url(key: string) {
    return `/media/${key}`;
  }
}
