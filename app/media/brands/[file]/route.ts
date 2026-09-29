// Serves uploaded brand images from storage/uploads/brands (outside public/, see
// lib/storage/images.ts). Only names we generate (`<uuid>.<jpg|png|webp>`) are accepted, so
// `../` and any other path trick is a 404. Public: brand logos are shown on the storefront.

import { readFile } from "node:fs/promises";
import { IMAGE_CONTENT_TYPES, storedImagePath, type ImageExt } from "@/lib/storage/images";

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const filePath = storedImagePath("brands", file);
  if (!filePath) return notFound();

  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return notFound();
    throw err;
  }

  const ext = file.slice(file.lastIndexOf(".") + 1) as ImageExt;
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": IMAGE_CONTENT_TYPES[ext],
      "Content-Length": String(data.length),
      // File names are random and never reused: a replaced image gets a new URL.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
