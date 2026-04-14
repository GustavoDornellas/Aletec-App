'use client';

import { getSupabaseClient, mapSupabaseError } from '@/services/supabaseClient';
import { normalizeUnitStatus } from '@/utils/produtoConstants';
import { createErrorResponse, createSuccessResponse } from '@/utils/serviceResponse';
import { validateUnidade } from '@/utils/validateUnidade';

function mapUnidade(row) {
  return {
    id: row.id,
    productId: row.product_id,
    sn: row.sn,
    status: normalizeUnitStatus(row.status),
    quantity: row.quantity || 1,
    image: row.image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildUnidadePayload(unidade) {
  return {
    product_id: unidade.productId,
    sn: String(unidade.sn ?? '').trim(),
    status: normalizeUnitStatus(unidade.status),
    quantity: Number(unidade.quantity ?? 1),
    image: unidade.image || null,
  };
}

export async function listUnidades() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel carregar as unidades.');
    }

    return createSuccessResponse((data || []).map(mapUnidade));
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel carregar as unidades.');
  }
}

export async function createUnidade(unidade) {
  const validation = validateUnidade(unidade);

  if (!validation.isValid) {
    return createErrorResponse('Revise os dados da unidade antes de salvar.', {
      code: 'validation_error',
      fields: validation.errors,
    });
  }

  try {
    const supabase = getSupabaseClient();
    const payload = buildUnidadePayload(unidade);
    const { data, error } = await supabase.from('units').insert(payload).select('*').single();

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel cadastrar a unidade.');
    }

    return createSuccessResponse(mapUnidade(data), 'Unidade cadastrada com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel cadastrar a unidade.');
  }
}

export async function updateUnidadeStatus(unitId, status) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('units')
      .update({ status: normalizeUnitStatus(status) })
      .eq('id', unitId)
      .select('*')
      .single();

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel atualizar o status da unidade.');
    }

    return createSuccessResponse(mapUnidade(data), 'Status atualizado com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel atualizar o status da unidade.');
  }
}

export async function deleteUnidade(unitId) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('units').delete().eq('id', unitId);

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel remover a unidade.');
    }

    return createSuccessResponse(true, 'Unidade removida com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel remover a unidade.');
  }
}
