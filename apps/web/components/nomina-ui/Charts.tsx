"use client";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const COLORS = ["#1F4E78", "#2E75B6", "#16A34A", "#CA8A04", "#DC2626", "#7C3AED", "#0891B2"];

export function PieDist({ data, dataKey, nameKey }: {
  data: { [k: string]: string | number }[];
  dataKey: string;
  nameKey: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarDist({ data, xKey, yKey, label }: {
  data: { [k: string]: string | number }[];
  xKey: string;
  yKey: string;
  label?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey={yKey} fill="#1F4E78" name={label || yKey} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
