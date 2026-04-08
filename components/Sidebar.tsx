'use client';

import React from 'react';
import { LayoutDashboard, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView: 'dashboard' | 'inventory';
  onViewChange: (view: 'dashboard' | 'inventory') => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeView, onViewChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-[70] transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed md:relative flex flex-col h-full w-64 bg-[#2d2d2d] border-r border-[#3a3a3a] shadow-xl flex-shrink-0 z-[80] transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="px-6 py-10 flex justify-center">
          <h1 className="font-headline font-black text-white text-4xl tracking-tight text-center">Aletec</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => onViewChange('dashboard')}
            className={cn(
              'w-full px-4 py-2 my-1 flex items-center gap-3 transition-all duration-200 rounded-lg',
              activeView === 'dashboard'
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            )}
          >
            <LayoutDashboard size={20} />
            <span className="text-sm font-medium tracking-wide">Dashboard</span>
          </button>
          <button
            onClick={() => onViewChange('inventory')}
            className={cn(
              'w-full px-4 py-2 my-1 flex items-center gap-3 transition-all duration-200 rounded-lg',
              activeView === 'inventory'
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            )}
          >
            <Cpu size={20} />
            <span className="text-sm font-medium tracking-wide">Inventário</span>
          </button>
        </nav>

        <div className="p-4" />
      </aside>
    </>
  );
}
