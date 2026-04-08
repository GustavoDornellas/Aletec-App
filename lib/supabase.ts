'use client';

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseClient;
}

export function handleSupabaseError(error: unknown, operationType: OperationType, path: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
        ? error.message
        : typeof error === 'object' && error !== null && 'error' in error && typeof error.error === 'string'
          ? error.error
          : String(error);
  const errInfo = {
    error: message,
    operationType,
    path,
  };

  console.error('Supabase Error:', JSON.stringify(errInfo));
  throw new Error(message);
}

export async function removeChannel(channel: RealtimeChannel) {
  const supabase = getSupabaseClient();
  await supabase.removeChannel(channel);
}
