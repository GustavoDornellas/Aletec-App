'use client';

import { getSupabaseClient, mapSupabaseError } from '@/services/supabaseClient';
import { PRODUCT_STATUS_ACTIVE } from '@/utils/produtoConstants';
import { createErrorResponse, createSuccessResponse } from '@/utils/serviceResponse';
import { validateProduto } from '@/utils/validateProduto';

function mapProduto(row) {
  return {
    id: row.id,
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
  return {
    name: String(produto.name ?? produto.nome ?? '').trim(),
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
