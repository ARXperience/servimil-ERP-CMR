import { providerCreditos } from "@/lib/dataProvider";
import type { Credito, Pago } from "@/lib/types/credito";
import {
  calcCreditos, kpisCartera, distribucionEstado,
  resumenPagaduria, bucketsMora, listaMora,
} from "@/lib/calc/creditFifo";

async function loadCalc() {
  const p = providerCreditos();
  const [creditosRaw, pagosRaw] = await Promise.all([
    p.list("Creditos") as Promise<unknown> as Promise<Credito[]>,
    p.list("Pagos")    as Promise<unknown> as Promise<Pago[]>,
  ]);
  return { creds: calcCreditos(creditosRaw, pagosRaw), pagos: pagosRaw };
}

export async function creditoDashboard() {
  const { creds, pagos } = await loadCalc();
  return {
    kpis: kpisCartera(creds, pagos),
    distribucion_estado: distribucionEstado(creds),
    buckets_mora: bucketsMora(creds),
  };
}

export async function creditoMora() {
  const { creds } = await loadCalc();
  return { creditos: listaMora(creds), buckets: bucketsMora(creds) };
}

export async function creditoPagaduria() {
  const { creds } = await loadCalc();
  return { pagadurias: resumenPagaduria(creds) };
}
