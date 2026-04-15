'use client';

import { getSupabaseClient, mapSupabaseError } from '@/services/supabaseClient';
import { PRODUCT_STATUS_ACTIVE } from '@/utils/produtoConstants';
import { createErrorResponse, createSuccessResponse } from '@/utils/serviceResponse';
import { validateProduto } from '@/utils/validateProduto';

function mapProduto(row) {
  return {
    id: row.id,
    brand: row.name,
    name: row.name,
    pn: row.pn,
    category: row.category,
    price: Number(row.price) || 0,
    image: row.image,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildProdutoPayload(produto) {
  const brand = String(produto.brand ?? produto.name ?? produto.nome ?? produto.marca ?? '').trim();

  return {
    name: brand,
    pn: String(produto.pn ?? '').trim(),
    category: String(produto.category ?? produto.categoria ?? 'Outros').trim() || 'Outros',
    price: Number(produto.price ?? produto.preco ?? 0),
    status: String(produto.status ?? produto.status_produto ?? PRODUCT_STATUS_ACTIVE).trim(),
    image: produto.image || null,
  };
}

export async function listProdutos() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel carregar os produtos.');
    }

    return createSuccessResponse((data || []).map(mapProduto));
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel carregar os produtos.');
  }
}

export async function createProduto(produto) {
  const validation = validateProduto(produto);

  if (!validation.isValid) {
    return createErrorResponse('Revise os dados do produto antes de salvar.', {
      code: 'validation_error',
      fields: validation.errors,
    });
  }

  try {
    const supabase = getSupabaseClient();
    const payload = buildProdutoPayload(produto);
    const { data, error } = await supabase.from('products').insert(payload).select('*').single();

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel cadastrar o produto.');
    }

    return createSuccessResponse(mapProduto(data), 'Produto cadastrado com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel cadastrar o produto.');
  }
}

export async function updateProduto(productId, produto) {
  const validation = validateProduto(produto);

  if (!validation.isValid) {
    return createErrorResponse('Revise os dados do produto antes de salvar.', {
      code: 'validation_error',
      fields: validation.errors,
    });
  }

  try {
    const supabase = getSupabaseClient();
    const payload = buildProdutoPayload(produto);
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .select('*')
      .single();

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel atualizar o produto.');
    }

    return createSuccessResponse(mapProduto(data), 'Produto atualizado com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel atualizar o produto.');
  }
}

export async function renameProdutoBrand(currentBrand, nextBrand) {
  const normalizedCurrentBrand = String(currentBrand ?? '').trim();
  const normalizedNextBrand = String(nextBrand ?? '').trim();

  if (!normalizedCurrentBrand || !normalizedNextBrand) {
    return createErrorResponse('Informe a marca atual e a nova marca para continuar.', {
      code: 'validation_error',
    });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .update({ name: normalizedNextBrand })
      .eq('name', normalizedCurrentBrand)
      .select('*');

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel atualizar a marca em todo o sistema.');
    }

    return createSuccessResponse(
      (data || []).map(mapProduto),
      `Marca "${normalizedCurrentBrand}" atualizada para "${normalizedNextBrand}".`
    );
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel atualizar a marca em todo o sistema.');
  }
}

export async function replaceProdutoBrand(currentBrand, replacementBrand) {
  const normalizedCurrentBrand = String(currentBrand ?? '').trim();
  const normalizedReplacementBrand = String(replacementBrand ?? '').trim();

  if (!normalizedCurrentBrand || !normalizedReplacementBrand) {
    return createErrorResponse('Selecione uma marca de substituicao para continuar.', {
      code: 'validation_error',
    });
  }

  if (normalizedCurrentBrand.toLowerCase() === normalizedReplacementBrand.toLowerCase()) {
    return createErrorResponse('Escolha uma marca diferente para substituir a marca atual.', {
      code: 'validation_error',
    });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .update({ name: normalizedReplacementBrand })
      .eq('name', normalizedCurrentBrand)
      .select('*');

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel excluir a marca selecionada.');
    }

    return createSuccessResponse(
      (data || []).map(mapProduto),
      `Marca "${normalizedCurrentBrand}" substituida por "${normalizedReplacementBrand}".`
    );
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel excluir a marca selecionada.');
  }
}

export async function deleteProduto(productId) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel remover o produto.');
    }

    return createSuccessResponse(true, 'Produto removido com sucesso.');
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel remover o produto.');
  }
}
