"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatUGXShort } from "@/lib/format";

type BranchData = { name: string; revenue: number; salesCount: number };

export function BranchChart({ data }: { data: BranchData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E35" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#5C5A7A", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
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
          formatter={(v) => [`UGX ${Number(v).toLocaleString()}`, "Revenue"]}
        />
        <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
