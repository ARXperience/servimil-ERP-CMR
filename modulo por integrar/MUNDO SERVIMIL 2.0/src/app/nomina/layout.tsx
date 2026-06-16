"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/nomina",          label: "Resumen" },
  { href: "/nomina/gestion",  label: "Base de datos" },
];

export default function NominaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Match longest prefix para que solo una tab quede activa.
  const active = TABS
    .filter((t) => pathname === t.href || pathname?.startsWith(t.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition",
              active === t.href
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
