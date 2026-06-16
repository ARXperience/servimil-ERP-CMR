"use client";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    const txt = await r.text();
    if (r.status === 429 || /RATE_LIMIT|RESOURCE_EXHAUSTED|Quota exceeded|Sheets ocupado/i.test(txt)) {
      throw new Error("El sistema está procesando muchas solicitudes. Espera unos segundos e intenta de nuevo.");
    }
    // Intenta parsear como JSON para sacar error.
    try {
      const j = JSON.parse(txt);
      throw new Error(j.error || `Error ${r.status}`);
    } catch {
      throw new Error(`Error ${r.status}`);
    }
  }
  return r.json();
};

export function useApi<T>(url: string | null) {
  return useSWR<T>(url, fetcher, { revalidateOnFocus: false });
}
