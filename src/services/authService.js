'use client';

import { getSupabaseClient, mapSupabaseError } from '@/services/supabaseClient';
import { createSuccessResponse } from '@/utils/serviceResponse';

function mapUser(user) {
  if (!user) {
    return null;
  }

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName:
      (typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name) ||
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
      user.email ||
      'Usuario',
    photoURL:
      (typeof user.user_metadata?.avatar_url === 'string' && user.user_metadata.avatar_url) || null,
  };
}

export function getSessionUser(session) {
  return mapUser(session?.user ?? null);
}

export async function signInWithPassword({ email, password }) {
  if (!String(email ?? '').trim() || !String(password ?? '').trim()) {
    return {
      success: false,
      data: null,
      message: '',
      error: {
        message: 'Informe e-mail e senha.',
      },
    };
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return mapSupabaseError(error, 'E-mail ou senha incorretos. Verifique os campos e tente novamente.');
    }

    return createSuccessResponse(mapUser(data.user));
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel entrar no sistema.');
  }
}

export async function signOut() {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel encerrar a sessao.');
    }

    return createSuccessResponse(true);
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel encerrar a sessao.');
  }
}
