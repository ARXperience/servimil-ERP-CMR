import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Content Studio AI | SERVIMIL OS',
};

const tabs = [
  { name: 'Dashboard', href: '/content-studio' },
  { name: 'Estrategia', href: '/content-studio/strategy' },
  { name: 'Calendario', href: '/content-studio/calendar' },
  { name: 'Generador', href: '/content-studio/generator' },
  { name: 'Brand Kit', href: '/content-studio/brand-kit' },
  { name: 'Aprobaciones', href: '/content-studio/approvals' },
  { name: 'Instagram', href: '/content-studio/instagram' },
];

export default function ContentStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <div className="border-b bg-white">
        <div className="flex h-12 items-center gap-6 px-8 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
