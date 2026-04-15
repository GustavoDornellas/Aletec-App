'use client';

import Image from 'next/image';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';

export function TopBar({ onMenuClick, title }) {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    await logout();
  }

  return (
    <header className="sticky top-0 z-40 flex w-full flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 backdrop-blur md:px-6 dark:border-zinc-700 dark:bg-zinc-900/95">
      <div className="flex flex-1 items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Menu size={20} />
        </button>
        <h2 className="truncate text-base font-bold tracking-tight text-slate-900 md:text-lg dark:text-slate-100">
          {title}
        </h2>
      </div>

      <div className="ml-auto flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo noturno'}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo noturno'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="ml-2 flex items-center gap-3">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {user.displayName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {user.email}
                </span>
              </div>

              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-200 dark:border-zinc-700">
                <Image
                  src={
                    user.photoURL ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuAXDvb0W9ZW1gdUDQzqoH0VgHRLZbRenP8sqLxtlFrJdbEfuklUa_gKUySh1X5OqWoC4enZCtNwMapM5VI9Qo3tx5ULQxWvazNwi_7DDxz04AVkGUTyJtIZNczOHWmAGEW8HJiqDZenw8aVTBHLgilukczqmZ43SEru7DPGAplKE-Yr5xOC8N9AdfUc4ACM2hX0E5I-5k7GtUJBzjgb-j-AP--EJhGqPwkoM-s2rpbg2bU0vU_vbQ0itd8C9kl5JGTf67H462ne8w'
                  }
                  alt="User Profile"
                  fill
                  className="object-cover"
                  unoptimized
                  referrerPolicy="no-referrer"
                />
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
