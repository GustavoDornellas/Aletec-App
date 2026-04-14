'use client';

import { Cpu, LayoutDashboard } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Sidebar({ activeView, isOpen, onClose, onViewChange }) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[70] bg-black/50 transition-opacity duration-300 md:hidden',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed z-[80] flex h-full w-[82vw] max-w-64 shrink-0 flex-col border-r border-[#3a3a3a] bg-[#2d2d2d] shadow-xl transition-transform duration-300 md:relative dark:border-zinc-700 dark:bg-zinc-900',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex justify-center px-6 py-10">
          <h1 className="text-center font-headline text-4xl font-black tracking-tight text-white">
            Aletec
          </h1>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          <button
            type="button"
            onClick={() => onViewChange('dashboard')}
            className={cn(
              'my-1 flex w-full items-center gap-3 rounded-lg px-4 py-2 transition-all duration-200',
              activeView === 'dashboard'
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            )}
          >
            <LayoutDashboard size={20} />
            <span className="text-sm font-medium tracking-wide">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('inventory')}
            className={cn(
              'my-1 flex w-full items-center gap-3 rounded-lg px-4 py-2 transition-all duration-200',
              activeView === 'inventory'
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            )}
          >
            <Cpu size={20} />
            <span className="text-sm font-medium tracking-wide">Inventario</span>
          </button>
        </nav>

        <div className="p-4" />
      </aside>
    </>
  );
}
