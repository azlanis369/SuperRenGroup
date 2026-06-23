import type { Metadata } from "next";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { getDeals } from "@/lib/data/deals";
import { getLeads } from "@/lib/data/leads";
import { getDict } from "@/lib/i18n/server";
import { DemoBadge } from "@/components/demo-badge";
import {
  PipelineBoard,
  type PipelineItem,
  type Stage,
} from "@/components/pipeline/pipeline-board";

export const metadata: Metadata = { title: "Pipeline" };

function leadStage(s: string): Stage {
  switch (s) {
    case "contacted": return "qualified";
    case "viewing": return "viewing";
    case "negotiating": return "negotiation";
    case "booked": return "booking";
    case "closed": return "completed";
    case "lost": return "lost";
    default: return "lead";
  }
}
function dealStage(s: string): Stage {
  switch (s) {
    case "pending": return "processing";
    case "closed": return "completed";
    case "cancelled":
    case "refund": return "lost";
    case "others": return "processing";
    default: return "booking";
  }
}

export default async function PipelinePage() {
  const user = await requireOnboardedUser();
  const admin = isAdmin(user.role);
  const scope = admin ? {} : { ownerId: user.id };

  const [{ deals, listingTitles: dealTitles }, leadsRes, dict] = await Promise.all([
    getDeals(scope),
    getLeads({}),
    getDict(),
  ]);
  const t = dict.pipeline;

  const leads = leadsRes.leads.filter((l) => admin || l.agent_id === user.id);
  const titles = new Map<string, string>([
    ...leadsRes.listingTitles,
    ...dealTitles,
  ]);

  const stamp = user.profile
    ? {
        name: user.profile.display_name || user.profile.full_name,
        phone: user.profile.whatsapp || user.profile.phone,
        ren: user.profile.ren_number,
        agency: user.profile.agency_name,
      }
    : undefined;

  const items: PipelineItem[] = [
    ...leads.map((l): PipelineItem => ({
      id: `lead-${l.id}`,
      kind: "lead",
      status: l.status,
      stage: leadStage(l.status),
      name: l.name,
      phone: l.phone,
      listingId: l.listing_id,
      listingTitle: l.listing_id ? (titles.get(l.listing_id) ?? null) : null,
      value: 0,
      valueText: l.budget ?? null,
    })),
    ...deals.map((d): PipelineItem => ({
      id: `deal-${d.id}`,
      kind: "deal",
      status: d.deal_status,
      stage: dealStage(d.deal_status),
      name: d.customer_name ?? "—",
      phone: d.customer_phone,
      listingId: d.listing_id,
      listingTitle: d.listing_id ? (titles.get(d.listing_id) ?? null) : null,
      value: Number(d.deal_type === "rental" ? d.rental_price : d.sold_price) || 0,
      valueText: null,
      dealType: d.deal_type,
    })),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">
          {admin ? t.subtitleAdmin : t.subtitleAgent} · {t.items(items.length)}
        </p>
        <DemoBadge className="mt-2" />
      </div>

      <PipelineBoard items={items} agent={stamp} />
    </div>
  );
}
