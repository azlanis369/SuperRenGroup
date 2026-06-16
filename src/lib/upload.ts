"use client";

import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKET, MEDIA_LIMITS } from "@/lib/constants";
import { LOCAL_DEMO } from "@/lib/demo-mode";

/** Compress an image client-side to keep uploads light (~2MB target). */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    return await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
    });
  } catch {
    return file; // fall back to original if compression fails
  }
}

export type UploadResult = {
  url: string;
  path: string;
  size: number;
};

/** Upload a file to Supabase Storage and return its public URL. */
export async function uploadToStorage(
  file: File,
  pathPrefix: string,
): Promise<UploadResult> {
  if (LOCAL_DEMO) {
    // No storage backend in the local demo — surface a clear message.
    throw new Error(
      "Muat naik dimatikan dalam Demo Mode tempatan. Sambungkan Supabase untuk simpan media.",
    );
  }
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, size: file.size };
}

export function validateImage(file: File): string | null {
  if (!MEDIA_LIMITS.acceptedImageTypes.includes(file.type))
    return "Format imej tidak disokong (gunakan JPG, PNG, atau WebP).";
  if (file.size > MEDIA_LIMITS.maxPhotoBytes * 4)
    return "Imej terlalu besar.";
  return null;
}

export function validateVideo(file: File): string | null {
  if (!MEDIA_LIMITS.acceptedVideoTypes.includes(file.type))
    return "Format video tidak disokong (gunakan MP4, MOV, atau WebM).";
  if (file.size > MEDIA_LIMITS.maxVideoBytes)
    return "Video melebihi had 100MB.";
  return null;
}
