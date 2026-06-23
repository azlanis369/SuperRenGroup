// Demo-only profile photo persistence. Stored as a resized data URL in the
// browser's localStorage (keyed by user id) because there's no storage backend
// in demo mode and a cookie is too small for an image. Shown via a small client
// overlay on the public profile so a changed photo "sticks" for the demo.

const PREFIX = "srg_demo_photo:";

export function demoPhotoKey(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function getDemoPhoto(userId: string): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(demoPhotoKey(userId));
  } catch {
    return null;
  }
}

export function setDemoPhoto(userId: string, dataUrl: string): void {
  try {
    localStorage.setItem(demoPhotoKey(userId), dataUrl);
  } catch {
    // storage full / unavailable — ignore
  }
}

/** Resize an image File to a square-ish data URL small enough for localStorage. */
export function fileToResizedDataUrl(file: File, max = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
