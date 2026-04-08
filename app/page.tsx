'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Dashboard from '@/components/Dashboard';
import Inventory from '@/components/Inventory';
import Login from '@/components/Login';
import { useFirebase } from '@/components/FirebaseProvider';
import { Loader2 } from 'lucide-react';

export default function Page() {
  const { user, loading } = useFirebase();
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Carregando Sistema...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar 
        activeView={activeView} 
        onViewChange={(view) => { setActiveView(view); setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title={activeView === 'dashboard' ? 'Dashboard' : 'Gerenciamento de Estoque'} 
          onMenuClick={() => setIsSidebarOpen(true)}
          showSectionLinks={activeView !== 'dashboard'}
        />
        
        <div className="flex-1 overflow-y-auto bg-surface">
          {activeView === 'dashboard' ? (
            <Dashboard />
          ) : (
            <Inventory />
          )}
        </div>
      </main>
    </div>
  );
}
