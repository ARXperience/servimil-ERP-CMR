'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useUIStore } from '@/stores/ui.store';
import { AiAssistantWidget } from '@/components/ai/AiAssistantWidget';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
        }`}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <AiAssistantWidget />
    </div>
  );
}
