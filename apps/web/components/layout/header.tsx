'use client';

import { Bell, Search, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'SV';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-xl">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en SERVIMIL OS..."
            className="h-9 w-[320px] rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white shadow-sm">
              {initials}
            </div>
            {user && (
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-slate-700">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-slate-400">{user.role}</p>
              </div>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-200/50">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
                  <User className="h-4 w-4" /> Mi Perfil
                </button>
                <button className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
                  <Settings className="h-4 w-4" /> Configuración
                </button>
              </div>
              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
