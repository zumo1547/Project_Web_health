const MAX_UPLOAD_EDGE = 1440;
const MAX_UPLOAD_BYTES = 1_200_000;
const REQUEST_TIMEOUT_MS = 25000;
const CAMERA_FORMAT_EXTENSIONS = [".heic", ".heif", ".jfif"];

type ImageDecodeResult = {
  width: number;
  height: number;
  close?: () => void;
  source: CanvasImageSource;
};

async function decodeImage(file: File): Promise<ImageDecodeResult> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);

      return {
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
        source: bitmap,
      };
    } catch (error) {
      console.error("CREATE_IMAGE_BITMAP_FAILED", error);
    }
  }

  const objectUrl = URL.createObjectURL(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.decoding = "async";
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
    element.src = objectUrl;
  });

  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => URL.revokeObjectURL(objectUrl),
    source: image,
  };
}

function shouldNormalizeImage(file: File) {
  const normalizedName = file.name.toLowerCase();

  return (
    file.size > MAX_UPLOAD_BYTES ||
    CAMERA_FORMAT_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
  );
}

export async function optimizeImageFile(file: File) {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  if (!shouldNormalizeImage(file)) {
    return file;
  }

  try {
    const decoded = await decodeImage(file);
    const scale = Math.min(
      1,
      MAX_UPLOAD_EDGE / decoded.width,
      MAX_UPLOAD_EDGE / decoded.height,
    );
    const targetWidth = Math.max(1, Math.round(decoded.width * scale));
    const targetHeight = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement("canvas");

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      decoded.close?.();
      return file;
    }

    context.drawImage(decoded.source, 0, 0, targetWidth, targetHeight);
    decoded.close?.();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.78);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const normalizedName = file.name.replace(/\.[^.]+$/, "") || "upload";

    return new File([blob], `${normalizedName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("CLIENT_IMAGE_OPTIMIZE_ERROR", error);
    return file;
  }
}

export async function buildOptimizedFormData(form: HTMLFormElement) {
  const formData = new FormData(form);
  const file = formData.get("file");

  if (file instanceof File && file.size > 0) {
    const optimizedFile = await optimizeImageFile(file);
    formData.set("file", optimizedFile, optimizedFile.name);
  }

  return formData;
}

export async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    error: text || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์",
  };
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeoutHandle = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutHandle);
  }
}
