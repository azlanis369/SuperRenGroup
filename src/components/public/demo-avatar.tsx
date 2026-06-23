"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { getDemoPhoto } from "@/lib/demo-photo";

/**
 * Avatar for the public profile that prefers a photo the agent saved in demo
 * mode (kept in localStorage), so a changed profile picture shows up. Falls
 * back to the server-provided photo, then to initials.
 */
export function DemoAvatar({
  userId,
  src,
  name,
  className,
  fallbackClassName,
}: {
  userId: string;
  src?: string | null;
  name: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [photo, setPhoto] = useState<string | null>(src ?? null);

  useEffect(() => {
    if (LOCAL_DEMO && userId) {
      const saved = getDemoPhoto(userId);
      if (saved) setPhoto(saved);
    }
  }, [userId]);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <Avatar className={className}>
      {photo ? <AvatarImage src={photo} alt={name} /> : null}
      <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
    </Avatar>
  );
}
