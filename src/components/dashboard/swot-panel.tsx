import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Swot, SwotItem } from "@/lib/data/stats";
import { cn } from "@/lib/utils";

const CONFIG = {
  strengths: {
    label: "Strengths",
    icon: TrendingUp,
    color: "text-green-700",
    bg: "bg-green-50 border-green-100",
  },
  weaknesses: {
    label: "Weaknesses",
    icon: TrendingDown,
    color: "text-red-700",
    bg: "bg-red-50 border-red-100",
  },
  opportunities: {
    label: "Opportunities",
    icon: Lightbulb,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-100",
  },
  threats: {
    label: "Threats",
    icon: AlertTriangle,
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-100",
  },
} as const;

function Quadrant({
  k,
  items,
}: {
  k: keyof typeof CONFIG;
  items: SwotItem[];
}) {
  const c = CONFIG[k];
  const Icon = c.icon;
  return (
    <div className={cn("rounded-xl border p-4", c.bg)}>
      <div className={cn("mb-3 flex items-center gap-2 font-semibold", c.color)}>
        <Icon className="h-4 w-4" />
        {c.label}
      </div>
      <ul className="space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium text-foreground">{it.title}</p>
            <p className="text-xs text-muted-foreground">{it.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SwotPanel({ swot }: { swot: Swot }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SWOT Intelligence</CardTitle>
        <p className="text-sm text-muted-foreground">
          Dijana automatik daripada data dalaman anda (listing, share, lead,
          deal). Bukan data pasaran luaran.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <Quadrant k="strengths" items={swot.strengths} />
          <Quadrant k="weaknesses" items={swot.weaknesses} />
          <Quadrant k="opportunities" items={swot.opportunities} />
          <Quadrant k="threats" items={swot.threats} />
        </div>
      </CardContent>
    </Card>
  );
}
