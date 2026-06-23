import type { Metadata } from "next";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { getViewings } from "@/lib/data/viewings";
import { getDict } from "@/lib/i18n/server";
import { DemoBadge } from "@/components/demo-badge";
import { ViewingBoard } from "@/components/viewings/viewing-board";

export const metadata: Metadata = { title: "Viewing Schedule" };

export default async function ViewingsPage() {
  const user = await requireOnboardedUser();
  const admin = isAdmin(user.role);
  const scope = admin ? {} : { ownerId: user.id };

  const [viewings, dict] = await Promise.all([getViewings(scope), getDict()]);
  const tv = dict.viewing;

  const stamp = user.profile
    ? {
        name: user.profile.display_name || user.profile.full_name,
        phone: user.profile.whatsapp || user.profile.phone,
        ren: user.profile.ren_number,
        agency: user.profile.agency_name,
      }
    : undefined;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tv.title}</h1>
        <p className="text-muted-foreground">
          {admin ? tv.subtitleAdmin : tv.subtitleAgent}
        </p>
        <DemoBadge className="mt-2" />
      </div>

      <ViewingBoard viewings={viewings} agent={stamp} />
    </div>
  );
}
