import type { Metadata } from "next";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { getContacts } from "@/lib/data/contacts";
import { getDict } from "@/lib/i18n/server";
import { DemoBadge } from "@/components/demo-badge";
import { ContactBoard } from "@/components/contacts/contact-board";

export const metadata: Metadata = { title: "Pelanggan" };

export default async function ContactsPage() {
  const user = await requireOnboardedUser();
  const admin = isAdmin(user.role);
  const scope = admin ? {} : { ownerId: user.id };

  const [contacts, dict] = await Promise.all([
    getContacts(scope, { admin, userId: user.id }),
    getDict(),
  ]);
  const tc = dict.contacts;

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
        <h1 className="text-2xl font-bold tracking-tight">{tc.title}</h1>
        <p className="text-muted-foreground">
          {admin ? tc.subtitleAdmin : tc.subtitleAgent}
        </p>
        <DemoBadge className="mt-2" />
      </div>

      <ContactBoard contacts={contacts} agent={stamp} />
    </div>
  );
}
