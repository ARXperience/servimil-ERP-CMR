export const runtime = "edge";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand">Resumen general</h1>
        <p className="text-sm text-slate-500">Panel ejecutivo del ecosistema.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["Cartera total", "Recaudo mes", "Empleados activos", "Alertas"].map((l) => (
          <div key={l} className="card">
            <div className="kpi-label">{l}</div>
            <div className="kpi-value">—</div>
          </div>
        ))}
      </div>
      <div className="card">
        <p className="text-sm text-slate-500">
          KPIs en construcción. Datos se conectan en Fase 3/4.
        </p>
      </div>
    </div>
  );
}
