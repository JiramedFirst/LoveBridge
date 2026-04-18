import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const ROOT = path.resolve(process.cwd(), process.env.UPLOAD_ROOT ?? "./uploads");

export async function saveFile(
  subdir: string,
  fileName: string,
  data: Buffer | Uint8Array,
): Promise<{ relativePath: string; absolutePath: string }> {
  const safeName = sanitize(fileName);
  const dir = path.join(ROOT, subdir);
  await fs.mkdir(dir, { recursive: true });
  const unique = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
  const absolutePath = path.join(dir, unique);
  await fs.writeFile(absolutePath, data);
  const relativePath = path.posix.join(subdir, unique);
  return { relativePath, absolutePath };
}

export async function readFile(relativePath: string): Promise<Buffer> {
  const abs = resolveSafe(relativePath);
  return fs.readFile(abs);
}

export async function deleteFile(relativePath: string): Promise<void> {
  const abs = resolveSafe(relativePath);
  await fs.unlink(abs).catch(() => undefined);
}

export function resolveSafe(relativePath: string): string {
  const abs = path.resolve(ROOT, relativePath);
  if (!abs.startsWith(ROOT)) {
    throw new Error("Path traversal detected");
  }
  return abs;
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}
