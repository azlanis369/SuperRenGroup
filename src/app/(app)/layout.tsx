import { requireOnboardedUser } from "@/lib/auth";
import { LanguageProvider } from "@/contexts/language-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOnboardedUser();
  const name = user.profile?.display_name || user.profile?.full_name || "Agent";

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background">
        <Sidebar role={user.role} />
        <div className="lg:pl-64">
          <Topbar name={name} photoUrl={user.profile?.profile_photo_url} />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6 lg:pb-10">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </LanguageProvider>
  );
}
