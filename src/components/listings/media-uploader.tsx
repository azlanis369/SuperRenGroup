"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  ImagePlus,
  Video,
  Star,
  X,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import {
  compressImage,
  uploadToStorage,
  validateImage,
  validateVideo,
} from "@/lib/upload";
import { MEDIA_LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MediaItem = {
  id: string;
  url: string;
  media_type: "image" | "video";
  caption?: string | null;
  file_size?: number | null;
  uploading?: boolean;
};

export function MediaUploader({
  value,
  onChange,
}: {
  value: MediaItem[];
  onChange: (next: MediaItem[]) => void;
}) {
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  const images = value.filter((m) => m.media_type === "image");
  const videos = value.filter((m) => m.media_type === "video");

  async function handleFiles(files: FileList | null, type: "image" | "video") {
    if (!files?.length) return;
    setError(null);

    if (type === "image" && images.length + files.length > MEDIA_LIMITS.maxPhotos) {
      setError(`Maksimum ${MEDIA_LIMITS.maxPhotos} gambar.`);
      return;
    }
    if (type === "video" && videos.length + files.length > MEDIA_LIMITS.maxVideos) {
      setError(`Maksimum ${MEDIA_LIMITS.maxVideos} video.`);
      return;
    }

    for (const file of Array.from(files)) {
      const invalid =
        type === "image" ? validateImage(file) : validateVideo(file);
      if (invalid) {
        setError(invalid);
        continue;
      }
      const tempId = crypto.randomUUID();
      const placeholder: MediaItem = {
        id: tempId,
        url: URL.createObjectURL(file),
        media_type: type,
        uploading: true,
      };
      onChange([...valueRef(), placeholder]);

      try {
        const prepared = type === "image" ? await compressImage(file) : file;
        const { url, size } = await uploadToStorage(prepared, "listings");
        replaceItem(tempId, { url, file_size: size, uploading: false });
      } catch {
        setError("Gagal memuat naik. Pastikan bucket storage wujud & polisi dibenarkan.");
        removeItem(tempId);
      }
    }
    if (imageInput.current) imageInput.current.value = "";
    if (videoInput.current) videoInput.current.value = "";
  }

  // Helpers that always read the latest value via closure-safe pattern
  let latest = value;
  function valueRef() {
    return latest;
  }
  function commit(next: MediaItem[]) {
    latest = next;
    onChange(next);
  }
  function replaceItem(id: string, patch: Partial<MediaItem>) {
    commit(valueRef().map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function removeItem(id: string) {
    commit(valueRef().filter((m) => m.id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    const arr = [...value];
    const i = arr.findIndex((m) => m.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  }
  function setHero(id: string) {
    const arr = [...value];
    const i = arr.findIndex((m) => m.id === id);
    if (i <= 0) return;
    const [item] = arr.splice(i, 1);
    arr.unshift(item);
    onChange(arr);
  }
  function reorder(from: number, to: number) {
    const arr = [...value];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => imageInput.current?.click()}
          disabled={images.length >= MEDIA_LIMITS.maxPhotos}
        >
          <ImagePlus className="h-4 w-4" /> Tambah gambar ({images.length}/
          {MEDIA_LIMITS.maxPhotos})
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => videoInput.current?.click()}
          disabled={videos.length >= MEDIA_LIMITS.maxVideos}
        >
          <Video className="h-4 w-4" /> Tambah video ({videos.length}/
          {MEDIA_LIMITS.maxVideos})
        </Button>
        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files, "image")}
        />
        <input
          ref={videoInput}
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files, "video")}
        />
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => imageInput.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-12 text-muted-foreground hover:border-gold"
        >
          <ImagePlus className="mb-2 h-8 w-8" />
          <span className="text-sm">Klik untuk muat naik gambar</span>
          <span className="text-xs">Gambar pertama jadi hero · maks 2MB selepas mampat</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((m, i) => (
            <div
              key={m.id}
              draggable={!m.uploading}
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex.current !== null && dragIndex.current !== i) {
                  reorder(dragIndex.current, i);
                }
                dragIndex.current = null;
              }}
              className={cn(
                "group relative overflow-hidden rounded-lg border border-border bg-card",
                i === 0 && m.media_type === "image" && "ring-2 ring-gold",
              )}
            >
              <div className="relative aspect-square bg-muted">
                {m.media_type === "video" ? (
                  <video src={m.url} className="h-full w-full object-cover" />
                ) : (
                  <Image
                    src={m.url}
                    alt=""
                    fill
                    sizes="200px"
                    className="object-cover"
                    unoptimized
                  />
                )}
                {m.uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                ) : null}
                {i === 0 && m.media_type === "image" ? (
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-gold-foreground">
                    <Star className="h-3 w-3" /> Hero
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeItem(m.id)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1 p-1.5">
                <button
                  type="button"
                  onClick={() => setHero(m.id)}
                  disabled={i === 0}
                  title="Jadikan hero"
                  className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(m.id, -1)}
                  disabled={i === 0}
                  className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(m.id, 1)}
                  disabled={i === value.length - 1}
                  className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <Input
                  value={m.caption ?? ""}
                  onChange={(e) => replaceItem(m.id, { caption: e.target.value })}
                  placeholder="Caption"
                  className="h-7 flex-1 px-2 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Seret untuk susun semula. Gambar pertama menjadi hero image.
      </p>
    </div>
  );
}
