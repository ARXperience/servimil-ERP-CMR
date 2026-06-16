"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/nomina", label: "Nómina" },
  { href: "/credito/admin", label: "Crédito · Admin" },
  { href: "/credito/asesoras", label: "Crédito · Asesoras" },
  { href: "/ocr", label: "OCR / Documentos" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 hidden md:flex md:flex-col">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="text-brand font-semibold leading-tight">Mundo Servimil</div>
        <div className="text-xs text-slate-500">v2.0</div>
      </div>
      <nav className="p-3 space-y-1">
        {NAV.map((n) => {
          // El más específico (más largo) gana — evita que /nomina y /nomina/gestion se iluminen ambos.
          const candidatos = NAV
            .filter((m) => m.href === pathname || (m.href !== "/" && pathname?.startsWith(m.href + "/")))
            .sort((a, b) => b.href.length - a.href.length);
          const active = candidatos[0]?.href === n.href || pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                "block rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-brand text-white"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
