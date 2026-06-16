"use client";
type Props = {
  label: string;
  value: string | number;
  /** Color de acento: "brand" | "ok" | "warn" | "bad" | "violet" | "cyan" */
  accent?: "brand" | "ok" | "warn" | "bad" | "violet" | "cyan";
  /** Delta vs periodo anterior, fracción (0.05 = +5%). undefined = no mostrar. */
  delta?: number | null;
  icon?: React.ReactNode;
  hint?: string;
};

const ACCENTS: Record<string, { bar: string; text: string; ring: string }> = {
  brand:  { bar: "bg-brand",        text: "text-brand",        ring: "ring-brand/20" },
  ok:     { bar: "bg-emerald-500",  text: "text-emerald-600",  ring: "ring-emerald-500/20" },
  warn:   { bar: "bg-amber-500",    text: "text-amber-600",    ring: "ring-amber-500/20" },
  bad:    { bar: "bg-red-500",      text: "text-red-600",      ring: "ring-red-500/20" },
  violet: { bar: "bg-violet-500",   text: "text-violet-600",   ring: "ring-violet-500/20" },
  cyan:   { bar: "bg-cyan-500",     text: "text-cyan-600",     ring: "ring-cyan-500/20" },
};

export default function KpiBig({ label, value, accent = "brand", delta, icon, hint }: Props) {
  const a = ACCENTS[accent];
  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
      <div className={`h-1 ${a.bar}`} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="kpi-label">{label}</div>
          {icon && <div className={`${a.text}`}>{icon}</div>}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className={`text-3xl font-semibold tabular-nums ${a.text}`}>{value}</div>
          {delta != null && isFinite(delta) && (
            <DeltaBadge delta={delta} />
          )}
        </div>
        {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
      </div>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  const up = delta >= 0;
  const pct = (Math.abs(delta) * 100).toFixed(1);
  return (
    <span className={
      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold " +
      (up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")
    }>
      <span>{up ? "↑" : "↓"}</span>
      <span>{pct}%</span>
    </span>
  );
}
