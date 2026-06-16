"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCop, formatPeriodoEs } from "@/lib/nomina-module/utils/format";

type Punto = { periodo: string; total_neto: number; total_devengado: number };

export default function LineaTendencia({ data }: { data: Punto[] }) {
  const series = data.map((d) => ({
    mes: formatPeriodoEs(d.periodo).slice(0, 3) + " " + formatPeriodoEs(d.periodo).slice(-2),
    Neto: d.total_neto,
    Devengado: d.total_devengado,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradNeto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1F4E78" stopOpacity={0.4}/>
            <stop offset="100%" stopColor="#1F4E78" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="gradDev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0891B2" stopOpacity={0.3}/>
            <stop offset="100%" stopColor="#0891B2" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v / 1_000_000).toFixed(1) + "M"} />
        <Tooltip
          formatter={(v: number) => formatCop(v)}
          contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E2E8F0" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        <Area type="monotone" dataKey="Devengado" stroke="#0891B2" strokeWidth={2} fill="url(#gradDev)" />
        <Area type="monotone" dataKey="Neto" stroke="#1F4E78" strokeWidth={2.5} fill="url(#gradNeto)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

