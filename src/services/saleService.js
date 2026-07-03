'use client';

import { getSupabaseClient, mapSupabaseError } from '@/services/supabaseClient';
import { createSuccessResponse } from '@/utils/serviceResponse';

function mapSale(row) {
  return {
    id: row.id,
    unitId: row.unit_id,
    soldValue: Number(row.valor_vendido) || 0,
    netValue: Number(row.valor_liquido) || 0,
    saleDate: row.data_venda,
    receiptDate: row.data_recebimento,
    note: row.observacao || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    unit: row.units
      ? {
          id: row.units.id,
          productId: row.units.product_id,
          status: row.units.status,
        }
      : null,
    product: row.units?.products
      ? {
          id: row.units.products.id,
          brand: row.units.products.name,
          name: row.units.products.name,
          pn: row.units.products.pn,
          category: row.units.products.category,
        }
      : null,
  };
}

function mapReturn(row) {
  return {
    id: row.id,
    saleId: row.sale_id,
    hadCost: Boolean(row.teve_custo),
    lossValue: Number(row.valor_prejuizo) || 0,
    reason: row.motivo,
    note: row.observacao || '',
    returnDate: row.data_devolucao,
    createdAt: row.created_at,
  };
}

export async function listSales() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('sales')
      .select(
        `
        *,
        units (
          id,
          product_id,
          status,
          products (
            id,
            name,
            pn,
            category
          )
        )
      `
      )
      .order('data_venda', { ascending: false });

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel carregar as vendas.');
    }

    return createSuccessResponse((data || []).map(mapSale));
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel carregar as vendas.');
  }
}

export async function listReturns() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .order('data_devolucao', { ascending: false });

    if (error) {
      return mapSupabaseError(error, 'Nao foi possivel carregar as devolucoes.');
    }

    return createSuccessResponse((data || []).map(mapReturn));
  } catch (error) {
    return mapSupabaseError(error, 'Nao foi possivel carregar as devolucoes.');
  }
}
