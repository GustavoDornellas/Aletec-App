'use client';

import { createClient } from '@supabase/supabase-js';
import { createErrorResponse } from '@/utils/serviceResponse';

let supabaseClient = null;

function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return createErrorResponse(
      'Supabase n\u00e3o configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
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
      'J\u00e1 existe um produto com esse modelo na mesma categoria.',
      { code: 'duplicate_product' }
    );
  }

  if (
    normalizedMessage.includes('units_product_id_sn_key') ||
    (normalizedMessage.includes('duplicate key value') && normalizedMessage.includes('units'))
  ) {
    return createErrorResponse(
      'O banco ainda est\u00e1 bloqueando c\u00f3digos repetidos para o mesmo produto. Aplique a migration que remove a restri\u00e7\u00e3o \u00fanica das unidades.',
      { code: 'duplicate_unit' }
    );
  }

  if (normalizedMessage.includes('row-level security')) {
    return createErrorResponse(
      'Voc\u00ea n\u00e3o tem permiss\u00e3o para realizar essa opera\u00e7\u00e3o.',
      { code: 'rls_denied' }
    );
  }

  return createErrorResponse(fallbackMessage || 'N\u00e3o foi poss\u00edvel concluir a opera\u00e7\u00e3o.', {
    code: 'supabase_error',
    details: rawMessage,
  });
}
