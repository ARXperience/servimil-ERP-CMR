type Props = { label: string; value: string | number; hint?: string };

export default function KpiCard({ label, value, hint }: Props) {
  return (
    <div className="card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}
