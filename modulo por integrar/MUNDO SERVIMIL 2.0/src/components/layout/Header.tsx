"use client";

export default function Header() {
  const hoy = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
      <div className="flex-1">
        <input
          type="search"
          placeholder="Buscar (próximamente)…"
          className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          disabled
        />
      </div>
      <div className="text-xs text-slate-500 capitalize">{hoy}</div>
    </header>
  );
}
