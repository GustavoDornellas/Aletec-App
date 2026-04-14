'use client';

import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Carregando...' }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}
