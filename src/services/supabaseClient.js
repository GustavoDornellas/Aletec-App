'use client';

import { createClient } from '@supabase/supabase-js';
import { createErrorResponse } from '@/utils/serviceResponse';

let supabaseClient = null;

function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return createErrorResponse(
      'Supabase nao configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return {
    success: true,
    data: {
      supabaseUrl,
      supabaseAnonKey,
    },
  };
}

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const credentials = getSupabaseCredentials();

  if (!credentials.success) {
    throw new Error(credentials.error.message);
  }

  supabaseClient = createClient(
    credentials.data.supabaseUrl,
    credentials.data.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );

  return supabaseClient;
}

export function mapSupabaseError(error, fallbackMessage) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error?.message === 'string'
        ? error.message
        : String(error);

  const normalizedMessage = rawMessage.toLowerCase();

  if (
    normalizedMessage.includes('duplicate key value') ||
    normalizedMessage.includes('products_pn_key') ||
    normalizedMessage.includes('products_pn_category_key')
  ) {
    return createErrorResponse(
      'Ja existe um produto com esse modelo na mesma categoria.',
      { code: 'duplicate_product' }
    );
  }

  if (normalizedMessage.includes('row-level security')) {
    return createErrorResponse(
      'Voce nao tem permissao para realizar essa operacao.',
      { code: 'rls_denied' }
    );
  }

  return createErrorResponse(fallbackMessage || 'Nao foi possivel concluir a operacao.', {
    code: 'supabase_error',
    details: rawMessage,
  });
}
