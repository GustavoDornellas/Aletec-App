'use client';

import { getSupabaseClient, mapSupabaseError } from '@/services/supabaseClient';
import {
  getLegacyDatabaseUnitStatus,
  normalizeUnitStatus,
  toDatabaseUnitStatus,
} from '@/utils/produtoConstants';
import { createErrorResponse, createSuccessResponse } from '@/utils/serviceResponse';
import { validateUnidade } from '@/utils/validateUnidade';

function mapUnidade(row) {
  return {
    id: row.id,
    productId: row.product_id,
    sn: row.sn,
    box: row.storage_box || '',
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
    storage_box: String(unidade.box ?? unidade.caixa ?? '').trim() || null,
    status: toDatabaseUnitStatus(unidade.status),
    quantity: Number(unidade.quantity ?? 1),
    image: unidade.image || null,
  };
}

function validateUnitQuantity(quantity) {
  const normalizedQuantity = Number.parseInt(String(quantity ?? ''), 10);

  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 1) {
    return createErrorResponse('Informe uma quantidade valida maior ou igual a 1.', {
      code: 'validation_error',
      fields: {
        quantity: 'A quantidade deve ser maior ou igual a 1.',
      },
    });
  }

  return null;
}

function validateUnitSerial(serial) {
  const normalizedSerial = String(serial ?? '').trim();

  if (!normalizedSerial) {
    return createErrorResponse('Informe um codigo da placa valido.', {
      code: 'validation_error',
      fields: {
        sn: 'Informe o codigo da placa.',
      },
    });
  }

  return null;
}

function isUnitStatusConstraintError(error) {
  const message = String(error?.message ?? '').toLowerCase();
  const details = String(error?.details ?? '').toLowerCase();
  const hint = String(error?.hint ?? '').toLowerCase();
  const code = String(error?.code ?? '').toLowerCase();

  return (
    code === '23514' ||
    message.includes('check constraint') ||
    details.includes('check constraint') ||
    hint.includes('check constraint')
  );
}

async function insertUnidadeWithStatusFallback(supabase, payload) {
  const { data, error } = await supabase.from('units').insert(payload).select('*').single();

  if (!error) {
    return { data, error: null };
  }

  if (!isUnitStatusConstraintError(error)) {
    return { data: null, error };
  }

  let lastError = error;

  for (const statusCandidate of getLegacyDatabaseUnitStatus(payload.status)) {
    const response = await supabase
      .from('units')
      .insert({ ...payload, status: statusCandidate })
      .select('*')
      .single();

    if (!response.error) {
      return response;
    }

    lastError = response.error;
  }

  return { data: null, error: lastError };
}

async function updateUnidadeStatusWithFallback(supabase, unitId, status) {
  const normalizedStatus = toDatabaseUnitStatus(status);
  const { data, error } = await supabase
    .from('units')
    .update({ status: normalizedStatus })
    .eq('id', unitId)
    .select('*')
    .single();

  if (!error) {
    return { data, error: null };
  }

  if (!isUnitStatusConstraintError(error)) {
    return { data: null, error };
  }

  let lastError = error;

  for (const statusCandidate of getLegacyDatabaseUnitStatus(normalizedStatus)) {
    const response = await supabase
      .from('units')
      .update({ status: statusCandidate })
      .eq('id', unitId)
      .select('*')
      .single();

    if (!response.error) {
      return response;
    }

    lastError = response.error;
  }

  return { data: null, error: lastError };
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
    const { data, error } = await insertUnidadeWithStatusFallback(supabase, payload);

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel cadastrar a unidade.');
    }

    return createSuccessResponse(mapUnidade(data), 'Unidade cadastrada com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel cadastrar a unidade.');
  }
}

export async function updateUnidade(unitId, unidade) {
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
    const { data, error } = await supabase
      .from('units')
      .update(payload)
      .eq('id', unitId)
      .select('*')
      .single();

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel atualizar a unidade.');
    }

    return createSuccessResponse(mapUnidade(data), 'Unidade atualizada com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel atualizar a unidade.');
  }
}

export async function updateUnidadeStatus(unitId, status) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await updateUnidadeStatusWithFallback(supabase, unitId, status);

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel atualizar o status da unidade.');
    }

    return createSuccessResponse(mapUnidade(data), 'Status atualizado com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel atualizar o status da unidade.');
  }
}

export async function updateUnidadeQuantity(unitId, quantity) {
  const validationError = validateUnitQuantity(quantity);

  if (validationError) {
    return validationError;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('units')
      .update({ quantity: Number.parseInt(String(quantity), 10) })
      .eq('id', unitId)
      .select('*')
      .single();

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel atualizar a quantidade da unidade.');
    }

    return createSuccessResponse(mapUnidade(data), 'Quantidade atualizada com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel atualizar a quantidade da unidade.');
  }
}

export async function updateUnidadeBox(unitId, box) {
  const normalizedBox = String(box ?? '').trim();

  if (normalizedBox.length > 60) {
    return createErrorResponse('Informe uma caixa com no maximo 60 caracteres.', {
      code: 'validation_error',
      fields: {
        box: 'Informe uma caixa com no maximo 60 caracteres.',
      },
    });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('units')
      .update({ storage_box: normalizedBox || null })
      .eq('id', unitId)
      .select('*')
      .single();

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel atualizar a caixa da unidade.');
    }

    return createSuccessResponse(mapUnidade(data), 'Caixa atualizada com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel atualizar a caixa da unidade.');
  }
}

export async function updateUnidadeSerial(unitId, serial) {
  const validationError = validateUnitSerial(serial);

  if (validationError) {
    return validationError;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('units')
      .update({ sn: String(serial).trim() })
      .eq('id', unitId)
      .select('*')
      .single();

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel atualizar o codigo da placa.');
    }

    return createSuccessResponse(mapUnidade(data), 'Codigo da placa atualizado com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel atualizar o codigo da placa.');
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
