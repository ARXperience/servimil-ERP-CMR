'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  CreditCard,
  Target,
  MessageSquare,
  Scale,
  FileText,
  Brain,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Kanban,
  Zap,
  Palette,
} from 'lucide-react';

const navSections = [
  {
    title: 'General',
    items: [
      { name: 'Panel Principal', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { name: 'Finanzas', href: '/finance', icon: DollarSign },
      { name: 'Nómina', href: '/nomina', icon: Users },
      { name: 'Créditos', href: '/credito/admin', icon: CreditCard },
      { name: 'OCR', href: '/ocr', icon: FileText },
      { name: 'CRM', href: '/crm', icon: Target },
    ],
  },
  {
    title: 'Comunicación',
    items: [
      { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare },
      { name: 'Embudo IA', href: '/whatsapp/pipeline', icon: Kanban },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { name: 'Jurídica', href: '/legal', icon: Scale },
      { name: 'Documentos', href: '/documents', icon: FileText },
      { name: 'IA Hub', href: '/ai-hub', icon: Brain },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { name: 'Content Studio AI', href: '/content-studio', icon: Palette },
    ],
  },
  {
    title: 'Análisis',
    items: [
      { name: 'Reportes', href: '/reports', icon: BarChart3 },
      { name: 'Uso de IA', href: '/ai-usage', icon: Zap },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { name: 'Administración', href: '/admin', icon: Shield },
      { name: 'Configuración', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-slate-900">SERVIMIL</span>
                <span className="ml-1 text-xs font-medium text-blue-600">OS</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <span className="text-sm font-bold text-white">S</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!sidebarCollapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      sidebarCollapsed && 'justify-center px-2'
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-lg bg-blue-50"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        'relative z-10 h-[18px] w-[18px] flex-shrink-0',
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600',
                        !sidebarCollapsed && 'mr-3'
                      )}
                    />
                    {!sidebarCollapsed && (
                      <span className="relative z-10">{item.name}</span>
                    )}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 hidden rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Collapse Toggle */}
      <div className="border-t border-slate-200/80 p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
