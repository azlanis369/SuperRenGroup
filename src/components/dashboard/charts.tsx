"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { fontSize: 11, fill: "hsl(215 16% 47%)" };
const GOLD = "hsl(41 52% 54%)";
const NAVY = "hsl(211 63% 16%)";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(215 20% 90%)",
  fontSize: 12,
  boxShadow: "0 4px 24px -4px rgb(16 42 67 / 0.10)",
};

export function MonthlyLineChart({
  data,
  color = NAVY,
}: {
  data: { month: string; count: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 92%)" vertical={false} />
        <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  dataKey = "count",
  labelKey = "label",
  color = GOLD,
}: {
  data: Record<string, string | number>[];
  dataKey?: string;
  labelKey?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 92%)" vertical={false} />
        <XAxis
          dataKey={labelKey}
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-15}
          height={48}
          textAnchor="end"
        />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(215 20% 95%)" }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal conversion funnel using proportional bars. */
export function Funnel({ data }: { data: { stage: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const pct = Math.round((d.count / max) * 100);
        const prev = i > 0 ? data[i - 1].count : d.count;
        const conv = prev > 0 ? Math.round((d.count / prev) * 100) : 100;
        return (
          <div key={d.stage}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{d.stage}</span>
              <span className="text-muted-foreground">
                {d.count.toLocaleString()}{" "}
                {i > 0 ? (
                  <span className="text-gold-foreground">· {conv}%</span>
                ) : null}
              </span>
            </div>
            <div className="h-7 w-full overflow-hidden rounded-lg bg-muted">
              <div
                className="flex h-full items-center rounded-lg bg-gradient-to-r from-primary to-primary/70"
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
