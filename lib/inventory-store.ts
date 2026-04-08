'use client';

import { getSupabaseClient, handleSupabaseError, OperationType } from './supabase';

export interface Product {
  id: string;
  name: string;
  pn: string;
  category: string;
  price: number;
  image: string | null;
  status: string;
  total: number;
  available: number;
  sold: number;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  productId: string;
  sn: string;
  status: string;
  quantity: number;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductRow {
  id: string;
  name: string;
  pn: string;
  category: string;
  price: number;
  image: string | null;
  status: string;
  total: number;
  available: number;
  sold: number;
  created_at: string;
  updated_at: string;
}

interface UnitRow {
  id: string;
  product_id: string;
  sn: string;
  status: string;
  quantity: number;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name: string;
  pn: string;
  category: string;
  price: number;
  status: string;
  image: string | null;
}

export interface UnitInput {
  productId: string;
  sn: string;
  status: string;
  quantity: number;
  image: string | null;
}

let productsCache: Product[] | null = null;
let unitsCache: Unit[] | null = null;
let productsPromise: Promise<Product[]> | null = null;
let unitsPromise: Promise<Unit[]> | null = null;

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    pn: row.pn,
    category: row.category,
    price: Number(row.price) || 0,
    image: row.image,
    status: row.status,
    total: row.total || 0,
    available: row.available || 0,
    sold: row.sold || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    productId: row.product_id,
    sn: row.sn,
    status: row.status,
    quantity: row.quantity || 1,
    image: row.image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function cloneProducts(products: Product[]) {
  return products.map((product) => ({ ...product }));
}

function cloneUnits(units: Unit[]) {
  return units.map((unit) => ({ ...unit }));
}

function setProductsCache(products: Product[]) {
  productsCache = cloneProducts(products);
}

function setUnitsCache(units: Unit[]) {
  unitsCache = cloneUnits(units);
}

function clearProductsPromise() {
  productsPromise = null;
}

function clearUnitsPromise() {
  unitsPromise = null;
}

export function primeProductCache(products: Product[]) {
  setProductsCache(products);
}

export function primeUnitsCache(units: Unit[]) {
  setUnitsCache(units);
}

export function invalidateInventoryCache() {
  productsCache = null;
  unitsCache = null;
  clearProductsPromise();
  clearUnitsPromise();
}

export function listProducts(options?: { force?: boolean }): Promise<Product[]> {
  if (!options?.force && productsCache) {
    return Promise.resolve(cloneProducts(productsCache));
  }

  if (!options?.force && productsPromise) {
    return productsPromise;
  }

  const supabase = getSupabaseClient();
  productsPromise = (async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    try {
      if (error) {
        handleSupabaseError(error, OperationType.LIST, 'products');
      }

      const mappedProducts = (data || []).map((row) => mapProduct(row as ProductRow));
      setProductsCache(mappedProducts);
      return cloneProducts(mappedProducts);
    } catch (error) {
      clearProductsPromise();
      throw error;
    } finally {
      clearProductsPromise();
    }
  })();

  return productsPromise;
}

export function listUnits(options?: { force?: boolean }): Promise<Unit[]> {
  if (!options?.force && unitsCache) {
    return Promise.resolve(cloneUnits(unitsCache));
  }

  if (!options?.force && unitsPromise) {
    return unitsPromise;
  }

  const supabase = getSupabaseClient();
  unitsPromise = (async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('updated_at', { ascending: false });

    try {
      if (error) {
        handleSupabaseError(error, OperationType.LIST, 'units');
      }

      const mappedUnits = (data || []).map((row) => mapUnit(row as UnitRow));
      setUnitsCache(mappedUnits);
      return cloneUnits(mappedUnits);
    } catch (error) {
      clearUnitsPromise();
      throw error;
    } finally {
      clearUnitsPromise();
    }
  })();

  return unitsPromise;
}

export async function createProduct(product: ProductInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: product.name,
      pn: product.pn,
      category: product.category,
      price: product.price,
      status: product.status,
      image: product.image,
    })
    .select('*')
    .single();

  if (error) {
    handleSupabaseError(error, OperationType.CREATE, 'products');
  }

  const nextProduct = mapProduct(data as ProductRow);
  const nextProducts = [nextProduct, ...(productsCache || [])];
  setProductsCache(nextProducts);
  return nextProduct;
}

export async function updateProduct(productId: string, product: ProductInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .update({
      name: product.name,
      pn: product.pn,
      category: product.category,
      price: product.price,
      status: product.status,
      image: product.image,
    })
    .eq('id', productId)
    .select('*')
    .single();

  if (error) {
    handleSupabaseError(error, OperationType.UPDATE, `products/${productId}`);
  }

  const nextProduct = mapProduct(data as ProductRow);

  if (productsCache) {
    setProductsCache(productsCache.map((product) => (product.id === productId ? nextProduct : product)));
  }

  return nextProduct;
}

export async function deleteProduct(productId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('products').delete().eq('id', productId);

  if (error) {
    handleSupabaseError(error, OperationType.DELETE, `products/${productId}`);
  }

  if (productsCache) {
    setProductsCache(productsCache.filter((product) => product.id !== productId));
  }

  if (unitsCache) {
    setUnitsCache(unitsCache.filter((unit) => unit.productId !== productId));
  }
}

export async function createUnit(unit: UnitInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('units')
    .insert({
      product_id: unit.productId,
      sn: unit.sn,
      status: unit.status,
      quantity: unit.quantity,
      image: unit.image,
    })
    .select('*')
    .single();

  if (error) {
    handleSupabaseError(error, OperationType.CREATE, `units/${unit.productId}`);
  }

  const nextUnit = mapUnit(data as UnitRow);
  const nextUnits = [nextUnit, ...(unitsCache || [])];
  setUnitsCache(nextUnits);
  return nextUnit;
}

export async function updateUnitStatus(unitId: string, status: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('units')
    .update({ status })
    .eq('id', unitId)
    .select('*')
    .single();

  if (error) {
    handleSupabaseError(error, OperationType.UPDATE, `units/${unitId}/status`);
  }

  const nextUnit = mapUnit(data as UnitRow);

  if (unitsCache) {
    setUnitsCache(unitsCache.map((unit) => (unit.id === unitId ? nextUnit : unit)));
  }

  return nextUnit;
}

export async function updateUnitQuantity(unitId: string, quantity: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('units')
    .update({ quantity })
    .eq('id', unitId)
    .select('*')
    .single();

  if (error) {
    handleSupabaseError(error, OperationType.UPDATE, `units/${unitId}/quantity`);
  }

  const nextUnit = mapUnit(data as UnitRow);

  if (unitsCache) {
    setUnitsCache(unitsCache.map((unit) => (unit.id === unitId ? nextUnit : unit)));
  }

  return nextUnit;
}

export async function deleteUnit(unitId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('units').delete().eq('id', unitId);

  if (error) {
    handleSupabaseError(error, OperationType.DELETE, `units/${unitId}`);
  }

  if (unitsCache) {
    setUnitsCache(unitsCache.filter((unit) => unit.id !== unitId));
  }
}
