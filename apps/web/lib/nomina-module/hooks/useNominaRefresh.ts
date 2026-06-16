"use client";
import { useSWRConfig } from "swr";

/**
 * Revalida endpoints nómina del periodo+corte tras mutaciones.
 * OPTIMIZADO: solo revalida las URLs específicas relevantes (no recorre todo el cache).
 * Hace UNA sola petición con ?fresh=1 al endpoint principal del mes — el resto
 * SWR revalida pasivamente al re-mount.
 */
export function useNominaRefresh() {
  const { mutate } = useSWRConfig();

  return async function refresh(periodo?: string, corte?: string) {
    const targets: string[] = [];

    // Solo los endpoints visibles más probables (no toda la combinatoria).
    targets.push("/api/nomina-data?ns=nomina&action=lista");
    targets.push("/api/nomina-data?ns=nomina&action=tendencia");
    if (corte) targets.push(`/api/nomina-data?ns=nomina&action=tendencia&corte=${encodeURIComponent(corte)}`);
    if (periodo) {
      targets.push(`/api/nomina-data?ns=gestion&action=mes&periodo=${encodeURIComponent(periodo)}`);
      if (corte) {
        targets.push(`/api/nomina-data?ns=nomina&action=periodo&periodo=${encodeURIComponent(periodo)}&corte=${encodeURIComponent(corte)}`);
      }
    }

    // UN solo fetch fresh=1 al endpoint mes (suficiente para invalidar caché server
    // en el isolate que atendió la mutación).
    if (periodo) {
      const url = `/api/nomina-data?ns=gestion&action=mes&periodo=${encodeURIComponent(periodo)}&fresh=1`;
      try { await fetch(url, { cache: "no-store" }); } catch { /* ignore */ }
    }

    // Revalida SWR en paralelo (sin fetch extra; usa el cache server ya invalidado).
    await Promise.allSettled(targets.map((k) => mutate(k)));
  };
}

