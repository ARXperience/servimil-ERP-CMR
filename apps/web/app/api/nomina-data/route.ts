import { NextRequest, NextResponse } from "next/server";
import {
  nominaLista, nominaPeriodo, nominaTendencia, nominaUpdate, nominaUpdateRecalc, nominaRecalcular,
} from "@/lib/nomina-module/handlers/nominaHandler";
import {
  creditoDashboard, creditoMora, creditoPagaduria,
} from "@/lib/nomina-module/handlers/creditoHandler";
import {
  gestionMes, empleadoCrear, empleadoActualizar, empleadoRetirar, empleadoBorrar,
} from "@/lib/nomina-module/handlers/gestionHandler";
import {
  asesoresLista, asesorCrear, asesorActualizar, asesorRetirar, asesorBorrar,
} from "@/lib/nomina-module/handlers/asesoresHandler";
import { desprendibleGenerar } from "@/lib/nomina-module/handlers/desprendibleHandler";
import { providerNomina, providerCreditos } from "@/lib/nomina-module/dataProvider";
import { clearParametrosCache } from "@/lib/nomina-module/parametros";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Endpoint ÚNICO del backend del dashboard.
 *
 * GET:
 *   ?ns=nomina&action=lista
 *   ?ns=nomina&action=periodo&periodo=YYYY-MM&corte=PRIMER
 *   ?ns=credito&action=dashboard
 *   ?ns=credito&action=mora
 *   ?ns=credito&action=pagaduria
 *
 * POST (body JSON):
 *   ?ns=nomina&action=update          body: { id, patch }     escribe fila tal cual
 *   ?ns=nomina&action=update-recalc   body: { id, overrides } recalcula fila + escribe
 *   ?ns=nomina&action=recalcular      body: { periodo, corte } recalcula todas FIJO del periodo
 *
 * Centralizado por bug vercel build 47 + Next 15 con múltiples API routes edge.
 */

async function handle(req: NextRequest, method: "GET" | "POST") {
  const sp = req.nextUrl.searchParams;
  const ns = sp.get("ns");
  const action = sp.get("action");
  // ?fresh=1 → invalida caché del provider antes de leer (mismo isolate CF).
  if (method === "GET" && sp.get("fresh") === "1") {
    providerNomina().invalidate();
    providerCreditos().invalidate();
    clearParametrosCache();
  }
  try {
    // --- GET handlers ---
    if (method === "GET") {
      if (ns === "nomina") {
        if (action === "lista") return NextResponse.json(await nominaLista());
        if (action === "periodo") {
          const periodo = sp.get("periodo");
          if (!periodo) return NextResponse.json({ error: "Falta 'periodo'" }, { status: 400 });
          return NextResponse.json(await nominaPeriodo(periodo, sp.get("corte")));
        }
        if (action === "tendencia") {
          return NextResponse.json(await nominaTendencia(sp.get("corte")));
        }
      }
      if (ns === "credito") {
        if (action === "dashboard") return NextResponse.json(await creditoDashboard());
        if (action === "mora")      return NextResponse.json(await creditoMora());
        if (action === "pagaduria") return NextResponse.json(await creditoPagaduria());
      }
      if (ns === "gestion" && action === "mes") {
        const periodo = sp.get("periodo");
        if (!periodo) return NextResponse.json({ error: "Falta 'periodo'" }, { status: 400 });
        return NextResponse.json(await gestionMes(periodo));
      }
      if (ns === "asesores" && action === "lista") {
        return NextResponse.json(await asesoresLista());
      }
      if (ns === "desprendible" && action === "generar") {
        const id = sp.get("id_empleado");
        const periodo = sp.get("periodo");
        const corte = sp.get("corte") || undefined;
        if (!id || !periodo) return NextResponse.json({ error: "Faltan id_empleado y periodo" }, { status: 400 });
        return NextResponse.json(await desprendibleGenerar(id, periodo, corte));
      }
    }

    // --- POST handlers ---
    if (method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (ns === "nomina") {
        if (action === "update") {
          return NextResponse.json(await nominaUpdate(body.id, body.patch || {}));
        }
        if (action === "update-recalc") {
          return NextResponse.json(await nominaUpdateRecalc(body.id, body.overrides || {}));
        }
        if (action === "recalcular") {
          return NextResponse.json(await nominaRecalcular(body.periodo, body.corte ?? null));
        }
      }
      if (ns === "gestion") {
        if (action === "empleado-crear") {
          return NextResponse.json(await empleadoCrear(body));
        }
        if (action === "empleado-actualizar") {
          return NextResponse.json(await empleadoActualizar(body.id, body.patch || {}));
        }
        if (action === "empleado-retirar") {
          return NextResponse.json(await empleadoRetirar(body.id));
        }
        if (action === "empleado-borrar") {
          return NextResponse.json(await empleadoBorrar(body.id));
        }
      }
      if (ns === "asesores") {
        if (action === "crear")      return NextResponse.json(await asesorCrear(body));
        if (action === "actualizar") return NextResponse.json(await asesorActualizar(body.id, body.patch || {}));
        if (action === "retirar")    return NextResponse.json(await asesorRetirar(body.id));
        if (action === "borrar")     return NextResponse.json(await asesorBorrar(body.id));
      }
    }

    return NextResponse.json(
      { error: `ns/action no reconocido: method=${method} ns=${ns} action=${action}` },
      { status: 400 }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest)  { return handle(req, "GET"); }
export async function POST(req: NextRequest) { return handle(req, "POST"); }

