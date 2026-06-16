"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
import { formatCop } from "@/lib/utils/format";

type Item = { cargo: string; total: number };

export default function BarsCargo({ data }: { data: Item[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => (v / 1_000_000).toFixed(1) + "M"} />
        <YAxis type="category" dataKey="cargo" tick={{ fontSize: 11 }} width={150} />
        <Tooltip
          formatter={(v: number) => formatCop(v)}
          contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E2E8F0" }}
        />
        <Bar dataKey="total" fill="#1F4E78" radius={[0, 6, 6, 0]}>
          <LabelList dataKey="total" position="right" formatter={(v: number) => formatCop(v)} style={{ fontSize: 10, fill: "#64748B" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
