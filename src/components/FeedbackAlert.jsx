'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function FeedbackAlert({ feedback }) {
  if (!feedback) {
    return null;
  }

  const isError = feedback.type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium',
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <span>{feedback.message}</span>
    </div>
  );
}
