"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-xl font-bold">Maaf, sesuatu tidak kena</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Ralat berlaku semasa memuatkan halaman ini. Sila cuba lagi.
      </p>
      <Button onClick={reset} className="mt-6">
        <RotateCw className="h-4 w-4" /> Cuba semula
      </Button>
    </div>
  );
}
