"use client";
type Props = {
  label: string;
  dias: number;
  personas: number;
  /** Color del icono / acento */
  tone: "ok" | "warn" | "bad" | "info";
  icon?: React.ReactNode;
};

const TONES = {
  ok:   { bg: "bg-emerald-50", text: "text-emerald-700", chip: "bg-emerald-100" },
  warn: { bg: "bg-amber-50",   text: "text-amber-700",   chip: "bg-amber-100" },
  bad:  { bg: "bg-red-50",     text: "text-red-700",     chip: "bg-red-100" },
  info: { bg: "bg-cyan-50",    text: "text-cyan-700",    chip: "bg-cyan-100" },
};

export default function MiniNovedad({ label, dias, personas, tone, icon }: Props) {
  const t = TONES[tone];
  return (
    <div className={`rounded-xl border border-slate-100 p-3 ${t.bg}`}>
      <div className="flex items-center justify-between">
        <div className={`text-xs font-semibold uppercase tracking-wide ${t.text}`}>{label}</div>
        {icon && <div className={t.text}>{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className={`text-2xl font-bold ${t.text}`}>{dias}</div>
        <div className="text-xs text-slate-500">días</div>
      </div>
      <div className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] ${t.chip} ${t.text}`}>
        {personas} {personas === 1 ? "persona" : "personas"}
      </div>
    </div>
  );
}
