import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requireOnboardedUser } from "@/lib/auth";
import { getLeads, getListingOptions } from "@/lib/data/leads";
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  type LeadStatus,
  type LeadSource,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { DemoBadge } from "@/components/demo-badge";
import { NewLeadButton } from "@/components/leads/new-lead-button";
import { LeadStatusSelect } from "@/components/leads/lead-status-select";
import { LeadFilterPills } from "@/components/leads/lead-filter-pills";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_TONE,
  LEAD_SOURCE_LABELS,
} from "@/components/leads/lead-status";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>;
}) {
  await requireOnboardedUser();
  const sp = await searchParams;

  const status =
    sp.status && (LEAD_STATUSES as readonly string[]).includes(sp.status)
      ? (sp.status as LeadStatus)
      : undefined;
  const source =
    sp.source && (LEAD_SOURCES as readonly string[]).includes(sp.source)
      ? (sp.source as LeadSource)
      : undefined;

  const [{ leads, listingTitles }, listingOptions] = await Promise.all([
    getLeads({ status, source }),
    getListingOptions(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">{leads.length} lead.</p>
          <DemoBadge className="mt-2" />
        </div>
        <NewLeadButton listings={listingOptions} />
      </div>

      <LeadFilterPills active={status} source={source} />

      {leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tiada lead dijumpai"
          description="Rekod prospek baru atau laraskan penapis."
          action={<NewLeadButton listings={listingOptions} />}
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Telefon</th>
                  <th className="px-4 py-3 font-medium">Sumber</th>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Tarikh</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{lead.name}</p>
                      {lead.preferred_area ? (
                        <p className="text-xs text-muted-foreground">
                          {lead.preferred_area}
                          {lead.budget ? ` · ${lead.budget}` : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-primary hover:underline"
                      >
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">
                        {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {lead.listing_id && listingTitles.has(lead.listing_id) ? (
                        <Link
                          href={`/listings/${lead.listing_id}`}
                          className="line-clamp-1 text-primary hover:underline"
                        >
                          {listingTitles.get(lead.listing_id)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusSelect id={lead.id} status={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {leads.map((lead) => (
              <Card key={lead.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{lead.name}</p>
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {lead.phone}
                    </a>
                  </div>
                  <Badge tone={LEAD_STATUS_TONE[lead.status]}>
                    {LEAD_STATUS_LABELS[lead.status]}
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge tone="neutral">
                    {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
                  </Badge>
                  <span>{formatDate(lead.created_at)}</span>
                  {lead.budget ? <span>· {lead.budget}</span> : null}
                  {lead.preferred_area ? <span>· {lead.preferred_area}</span> : null}
                </div>

                {lead.listing_id && listingTitles.has(lead.listing_id) ? (
                  <Link
                    href={`/listings/${lead.listing_id}`}
                    className="mt-2 line-clamp-1 block text-sm text-primary hover:underline"
                  >
                    {listingTitles.get(lead.listing_id)}
                  </Link>
                ) : null}

                <div className="mt-3 border-t border-border pt-3">
                  <LeadStatusSelect id={lead.id} status={lead.status} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
