import Link from "next/link";
import { Logo } from "@/components/brand";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <article className="prose-sm space-y-4 text-sm leading-relaxed text-muted-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">
          {children}
        </article>
      </main>
    </div>
  );
}
