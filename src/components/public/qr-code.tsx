"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({
  value,
  size = 160,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#0f2a43", light: "#ffffff" },
    })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size]);

  if (!src) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={size}
      height={size}
      alt="QR code profil"
      className={className}
    />
  );
}
