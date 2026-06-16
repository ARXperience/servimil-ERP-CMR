'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Activity, Settings, MessageSquare, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AiHubLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Chat Assistant', href: '/ai-hub', icon: MessageSquare },
    { name: 'Ejecuciones', href: '/ai-hub/logs', icon: Activity },
    { name: 'Historial', href: '/ai-hub/history', icon: History },
    { name: 'Configuración', href: '/ai-hub/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="border-b bg-white dark:bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">IA Hub Enterprise</h1>
            <p className="text-sm text-slate-500">Agente y Orquestador del Sistema</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sub-sidebar for AI Hub */}
        <aside className="w-64 border-r bg-white dark:bg-slate-950 p-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" 
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
