import Link from "next/link";
import { Home } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Logo />
      <h1 className="mt-8 text-5xl font-bold tracking-tight text-primary">404</h1>
      <p className="mt-2 text-muted-foreground">
        Halaman atau listing ini tidak dijumpai.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">
          <Home className="h-4 w-4" /> Kembali ke utama
        </Link>
      </Button>
    </div>
  );
}
