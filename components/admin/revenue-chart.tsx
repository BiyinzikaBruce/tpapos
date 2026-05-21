"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatUGXShort } from "@/lib/format";

type DataPoint = { label: string; total: number; cash: number; momo: number };

export function RevenueChart({ data }: { data: DataPoint[] }) {
  const shown = data.filter((_, i) => i % 3 === 0 || i === data.length - 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E35" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#5C5A7A", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatUGXShort}
          tick={{ fill: "#5C5A7A", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ background: "#12122A", border: "1px solid #2A2A45", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#A09EC0" }}
          formatter={(v) => [`UGX ${Number(v).toLocaleString()}`, ""]}
        />
        <Area type="monotone" dataKey="total" stroke="#7C3AED" strokeWidth={2} fill="url(#totalGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
