"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { formatCop } from "@/lib/nomina-module/utils/format";

const PALETTE = ["#1F4E78", "#16A34A", "#CA8A04", "#DC2626", "#7C3AED", "#0891B2", "#EC4899", "#65A30D"];

type Item = { name: string; value: number };

export function Donut({ data, totalLabel = "Total" }: { data: Item[]; totalLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={2} stroke="#fff" strokeWidth={2}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip
            formatter={(v: number) => formatCop(v)}
            contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E2E8F0" }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
      {total > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-6">
          <div className="text-[10px] uppercase text-slate-400 tracking-wide">{totalLabel}</div>
          <div className="text-lg font-bold text-slate-800">{formatCop(total)}</div>
        </div>
      )}
    </div>
  );
}

