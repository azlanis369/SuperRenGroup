import type { Metadata } from "next";
import { Handshake, CheckCircle2, Wallet, Clock } from "lucide-react";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { getDeals } from "@/lib/data/deals";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/empty-state";
import { DealsBoard } from "@/components/deals/deals-board";
import { DemoBadge } from "@/components/demo-badge";

export const metadata: Metadata = { title: "Tawaran" };

export default async function DealsPage() {
  const user = await requireOnboardedUser();
  const admin = isAdmin(user.role);
  const { deals, listingTitles } = await getDeals(
    admin ? {} : { ownerId: user.id },
  );
  const stamp = user.profile
    ? {
        name: user.profile.display_name || user.profile.full_name,
        phone: user.profile.whatsapp || user.profile.phone,
        ren: user.profile.ren_number,
        agency: user.profile.agency_name,
      }
    : undefined;

  const closed = deals.filter((d) => d.deal_status === "closed");
  const totalCommission = closed.reduce(
    (sum, d) => sum + (Number(d.commission_amount) || 0),
    0,
  );
  const openCount = deals.filter((d) =>
    ["booked", "pending"].includes(d.deal_status),
  ).length;
  const closeDurations = closed
    .filter((d) => d.booking_date && d.closed_date)
    .map((d) =>
      Math.max(
        0,
        Math.round(
          (new Date(d.closed_date!).getTime() -
            new Date(d.booking_date!).getTime()) /
            86400000,
        ),
      ),
    );
  const avgDaysToClose =
    closeDurations.length > 0
      ? Math.round(
          closeDurations.reduce((a, b) => a + b, 0) / closeDurations.length,
        )
      : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tawaran</h1>
        <p className="text-muted-foreground">
          {admin
            ? "Urus & jejak semua deal kumpulan — booking hingga closed."
            : "Urus & jejak deal anda — dari booking hingga closed."}
        </p>
        <DemoBadge className="mt-2" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Jumlah Tawaran" value={deals.length} icon={Handshake} />
        <StatCard
          label="Dalam Pipeline"
          value={openCount}
          hint="booking + pending"
          icon={Clock}
          tone="gold"
        />
        <StatCard
          label="Closed"
          value={closed.length}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Komisen (closed)"
          value={formatPrice(totalCommission)}
          hint={`purata ${avgDaysToClose} hari tutup`}
          icon={Wallet}
          tone="gold"
        />
      </div>

      {deals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Tiada tawaran lagi"
          description="Tawaran akan muncul di sini apabila booking atau jualan direkodkan."
        />
      ) : (
        <DealsBoard
          deals={deals}
          titles={Object.fromEntries(listingTitles)}
          agent={stamp}
        />
      )}
    </div>
  );
}
