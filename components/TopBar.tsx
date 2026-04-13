'use client';

import React from 'react';
import Image from 'next/image';
import { LogOut, LogIn, Menu, Moon, Sun } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { useTheme } from './ThemeProvider';

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
  showSectionLinks?: boolean;
}

export default function TopBar({
  title,
  onMenuClick,
  showSectionLinks = true,
}: TopBarProps) {
  const { user, login, logout } = useFirebase();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex flex-wrap justify-between items-center w-full gap-3 px-4 md:px-6 py-3 bg-white border-b border-slate-200 z-40 sticky top-0 backdrop-blur dark:bg-zinc-900/95 dark:border-zinc-700">
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 md:hidden transition-colors dark:hover:bg-zinc-800 dark:text-zinc-300"
        >
          <Menu size={20} />
        </button>
        <h2 className="font-headline font-bold text-base md:text-lg tracking-tight text-slate-900 truncate dark:text-slate-100">{title}</h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6 ml-auto">
        {showSectionLinks && (
          <>
            <nav className="hidden lg:flex items-center gap-8">
              <a className="text-primary font-bold border-b-2 border-primary text-sm py-1" href="#">Visão Geral</a>
            </nav>

            <div className="h-6 w-px bg-slate-200 mx-2 hidden lg:block dark:bg-zinc-800"></div>
          </>
        )}

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
            <div className="flex items-center gap-3 ml-2">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.displayName}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{user.email}</span>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 relative dark:border-zinc-700">
                <Image
                  src={user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuAXDvb0W9ZW1gdUDQzqoH0VgHRLZbRenP8sqLxtlFrJdbEfuklUa_gKUySh1X5OqWoC4enZCtNwMapM5VI9Qo3tx5ULQxWvazNwi_7DDxz04AVkGUTyJtIZNczOHWmAGEW8HJiqDZenw8aVTBHLgilukczqmZ43SEru7DPGAplKE-Yr5xOC8N9AdfUc4ACM2hX0E5I-5k7GtUJBzjgb-j-AP--EJhGqPwkoM-s2rpbg2bU0vU_vbQ0itd8C9kl5JGTf67H462ne8w"}
                  alt="User Profile"
                  fill
                  className="object-cover"
                  unoptimized
                  referrerPolicy="no-referrer"
                />
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors dark:hover:bg-red-950/40"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                void login();
              }}
              className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
            >
              <LogIn size={14} />
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
