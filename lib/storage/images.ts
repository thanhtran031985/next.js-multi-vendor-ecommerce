// Uploaded image storage on the local disk, outside public/ (Next only serves public/ files
// that existed at build time, so runtime uploads would 404 under `next start`). Files are
// served by route handlers under /media/<bucket>/<file> (app/media/brands/[file]/route.ts).
//
// Never trusts the client: size is the number of bytes actually received, and the type is
// detected from magic bytes, not from the MIME type or file extension. SVG is not accepted.
// Stored names are `<uuid>.<ext of the detected type>`; the original name is never used.
//
// TODO(production): chuyển sang S3/R2 (local disk does not survive redeploys or scale out).

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type ImageBucket = "brands";
export type ImageExt = "jpg" | "png" | "webp";

export const IMAGE_CONTENT_TYPES: Record<ImageExt, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Stored file names: `<uuid>.<ext>`. Anything else (e.g. `../`) is rejected. */
export const STORED_IMAGE_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

/** A problem with the uploaded file itself; the message is safe to show to the user. */
export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  bytes.length >= offset + signature.length && signature.every((b, i) => bytes[offset + i] === b);

/** JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, WEBP `RIFF....WEBP`; anything else -> null. */
export function detectImageExt(bytes: Uint8Array): ImageExt | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}

/** Absolute path of a stored file, or null if the name is not one we generate. */
export function storedImagePath(bucket: ImageBucket, fileName: string): string | null {
  if (!STORED_IMAGE_NAME.test(fileName)) return null;
  return path.join(STORAGE_ROOT, bucket, fileName);
}

/** Public URL path stored in the DB for a saved file. */
export function publicImagePath(bucket: ImageBucket, fileName: string): string {
  return `/media/${bucket}/${fileName}`;
}

export type SaveImageOptions = { maxBytes: number; tooLargeMessage: string; badTypeMessage: string };

/**
 * Validates the real bytes and writes the file. Returns the public path (`/media/<bucket>/<file>`).
 * Throws ImageValidationError for a bad file; other errors (disk) propagate.
 */
export async function saveImage(bucket: ImageBucket, file: File, options: SaveImageOptions): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) throw new ImageValidationError(options.badTypeMessage);
  if (bytes.length > options.maxBytes) throw new ImageValidationError(options.tooLargeMessage);

  const ext = detectImageExt(bytes);
  if (!ext) throw new ImageValidationError(options.badTypeMessage);

  const fileName = `${randomUUID()}.${ext}`;
  const dir = path.join(STORAGE_ROOT, bucket);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), bytes, { flag: "wx" }); // never overwrite
  return publicImagePath(bucket, fileName);
}

/**
 * Deletes a file saved by saveImage, given its public path. A missing file is not an error.
 * Paths we did not generate are ignored, so a bad DB value can never delete other files.
 */
export async function deleteImage(publicPath: string): Promise<void> {
  const match = /^\/media\/(brands)\/([^/]+)$/.exec(publicPath);
  const filePath = match ? storedImagePath(match[1] as ImageBucket, match[2]) : null;
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
