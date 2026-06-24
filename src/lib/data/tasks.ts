import { getLeads } from "@/lib/data/leads";
import { getDeals } from "@/lib/data/deals";
import { getViewings } from "@/lib/data/viewings";

export type TaskType = "lead" | "deal" | "viewing";
export type TaskPriority = "overdue" | "today" | "soon";

export type FollowUpTask = {
  id: string;
  type: TaskType;
  /** original lead/deal status (for the Autobot) */
  status: string;
  title: string; // what to do
  customerName: string;
  phone: string | null;
  listingId: string | null;
  listingTitle: string | null;
  dueAt: string | null; // ISO; null = no fixed time
  priority: TaskPriority;
  dealType?: "sale" | "rental";
};

const DAY = 86400000;
const startOfToday = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
};

function priorityFor(dueAt: number | null, fallback: TaskPriority): TaskPriority {
  if (dueAt == null) return fallback;
  const today = startOfToday();
  if (dueAt < today) return "overdue";
  if (dueAt < today + DAY) return "today";
  return "soon";
}

/**
 * Build the agent's actionable follow-up list by aggregating leads, deals and
 * viewings that need attention. This is the action inbox behind the dashboard's
 * "what to do today" section.
 */
export async function getFollowUpTasks(
  scope: { ownerId?: string } = {},
  opts: { admin?: boolean; userId?: string } = {},
): Promise<FollowUpTask[]> {
  const [leadsRes, dealsRes, viewings] = await Promise.all([
    getLeads({}),
    getDeals(scope),
    getViewings(scope),
  ]);

  const titles = new Map<string, string>([
    ...leadsRes.listingTitles,
    ...dealsRes.listingTitles,
  ]);

  const leads = leadsRes.leads.filter(
    (l) => opts.admin || l.agent_id === opts.userId,
  );

  const tasks: FollowUpTask[] = [];

  // Leads that still need a first/again touch.
  for (const l of leads) {
    if (!["new", "contacted"].includes(l.status)) continue;
    const created = new Date(l.created_at).getTime();
    // A lead is "due" 1 day after it came in; new leads are urgent.
    const dueAt = created + (l.status === "new" ? 0 : DAY);
    tasks.push({
      id: `lead-${l.id}`,
      type: "lead",
      status: l.status,
      title: l.status === "new" ? "Hubungi lead baharu" : "Follow up lead",
      customerName: l.name,
      phone: l.phone,
      listingId: l.listing_id,
      listingTitle: l.listing_id ? (titles.get(l.listing_id) ?? null) : null,
      dueAt: new Date(dueAt).toISOString(),
      priority: priorityFor(dueAt, "soon"),
    });
  }

  // Deals in progress that need the next step.
  const DEAL_ACTION: Record<string, string> = {
    booked: "Sahkan dokumen & deposit",
    pending: "Follow up status loan/SPA",
  };
  for (const d of dealsRes.deals) {
    const action = DEAL_ACTION[d.deal_status];
    if (!action) continue;
    const base = new Date(d.booking_date ?? d.created_at).getTime();
    const dueAt = base + 3 * DAY; // chase ~3 days after booking
    tasks.push({
      id: `deal-${d.id}`,
      type: "deal",
      status: d.deal_status,
      title: action,
      customerName: d.customer_name ?? "—",
      phone: d.customer_phone,
      listingId: d.listing_id,
      listingTitle: d.listing_id ? (titles.get(d.listing_id) ?? null) : null,
      dueAt: new Date(dueAt).toISOString(),
      priority: priorityFor(dueAt, "soon"),
      dealType: d.deal_type,
    });
  }

  // Upcoming / overdue scheduled viewings.
  for (const v of viewings) {
    if (v.status !== "scheduled" && v.status !== "rescheduled") continue;
    const ts = new Date(v.scheduled_at).getTime();
    if (ts > startOfToday() + 7 * DAY) continue; // only the next week
    tasks.push({
      id: `viewing-${v.id}`,
      type: "viewing",
      status: "viewing",
      title: ts < Date.now() ? "Dapatkan outcome viewing" : "Sediakan viewing",
      customerName: v.prospect_name,
      phone: v.prospect_phone,
      listingId: v.listing_id,
      listingTitle: v.listing_title,
      dueAt: v.scheduled_at,
      priority: priorityFor(ts, "today"),
    });
  }

  // Sort: overdue → today → soon, then by due time.
  const rank: Record<TaskPriority, number> = { overdue: 0, today: 1, soon: 2 };
  return tasks.sort((a, b) => {
    if (rank[a.priority] !== rank[b.priority])
      return rank[a.priority] - rank[b.priority];
    return (a.dueAt ?? "").localeCompare(b.dueAt ?? "");
  });
}
