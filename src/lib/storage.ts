import { del, put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
};

function getFileExtension(file: File) {
  const fromName = path.extname(file.name || "").toLowerCase();

  if (fromName) {
    return fromName;
  }

  return MIME_EXTENSIONS[file.type] ?? ".bin";
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9/-]/g, "-").replace(/-+/g, "-");
}

function isVercelRuntime() {
  return (
    process.env.VERCEL === "1" ||
    Boolean(process.env.VERCEL_ENV) ||
    Boolean(process.env.VERCEL_URL)
  );
}

async function createInlineImageDataUrl(buffer: Buffer, file: File) {
  const mimeType = file.type || "application/octet-stream";

  try {
    if (mimeType.startsWith("image/")) {
      const optimized = await sharp(buffer)
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 82,
        })
        .toBuffer();

      return {
        url: `data:image/webp;base64,${optimized.toString("base64")}`,
        fileName: `${randomUUID()}.webp`,
        driver: "inline-data" as const,
      };
    }
  } catch (error) {
    console.error("INLINE_UPLOAD_OPTIMIZE_ERROR", error);
  }

  return {
    url: `data:${mimeType};base64,${buffer.toString("base64")}`,
    fileName: `${randomUUID()}${getFileExtension(file)}`,
    driver: "inline-data" as const,
  };
}

export async function storeUpload(file: File, folder: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = getFileExtension(file);
  const fileName = `${randomUUID()}${extension}`;
  const safeFolder = sanitizeSegment(folder);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${safeFolder}/${fileName}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || undefined,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return {
      url: blob.url,
      fileName,
      driver: "vercel-blob" as const,
    };
  }

  if (isVercelRuntime()) {
    return createInlineImageDataUrl(buffer, file);
  }

  const targetDir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await mkdir(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, fileName);
  await writeFile(targetPath, buffer);

  return {
    url: `/uploads/${safeFolder}/${fileName}`,
    fileName,
    driver: "local" as const,
  };
}

export async function removeStoredUpload(url: string) {
  if (!url) {
    return {
      driver: "unknown" as const,
    };
  }

  if (url.startsWith("data:")) {
    return {
      driver: "inline-data" as const,
    };
  }

  if (url.startsWith("/uploads/")) {
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
    const relativePath = url.replace(/^\/uploads\//, "");
    const targetPath = path.resolve(uploadsRoot, relativePath);

    if (!targetPath.startsWith(uploadsRoot)) {
      throw new Error("INVALID_UPLOAD_PATH");
    }

    try {
      await unlink(targetPath);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
        throw error;
      }
    }

    return {
      driver: "local" as const,
    };
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return {
      driver: "vercel-blob" as const,
    };
  }

  return {
    driver: "unknown" as const,
  };
}
