'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { DashboardView } from '@/components/DashboardView';
import { FeedbackAlert } from '@/components/FeedbackAlert';
import { LoadingState } from '@/components/LoadingState';
import { LoginForm } from '@/components/LoginForm';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useProdutos } from '@/hooks/useProdutos';
import { InventoryView } from '@/views/InventoryView';

export function HomePageContent() {
  const { loading: authLoading, user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const inventory = useProdutos();

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Carregando sistema...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-surface dark:bg-zinc-900 md:h-screen">
      <Sidebar
        activeView={activeView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onViewChange={(nextView) => {
          setActiveView(nextView);
          setIsSidebarOpen(false);
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title={activeView === 'dashboard' ? 'Dashboard' : 'Gerenciamento de Estoque'}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto bg-surface dark:bg-zinc-900">
          {inventory.loading ? (
            <LoadingState message="Carregando inventario..." />
          ) : activeView === 'dashboard' ? (
            <div className="space-y-6 p-4 md:p-8">
              <FeedbackAlert
                feedback={
                  inventory.error
                    ? { type: 'error', message: inventory.error }
                    : null
                }
              />
              <DashboardView products={inventory.products} summary={inventory.summary} />
            </div>
          ) : (
            <InventoryView
              products={inventory.products}
              brands={inventory.brands}
              unitsByProduct={inventory.unitsByProduct}
              inventoryError={inventory.error}
              refreshing={inventory.refreshing}
              onImportRows={inventory.importRows}
              onRemoveProduct={inventory.removeProduct}
              onRenameBrand={inventory.renameBrand}
              onReplaceBrand={inventory.replaceBrand}
              onRemoveUnit={inventory.removeUnit}
              onSaveProduct={inventory.saveProduct}
              onSaveUnit={inventory.saveUnit}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HomePageContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
