'use client';
import { getSupabaseClient, handleSupabaseError, OperationType } from './supabase';
let productsCache = null;
let unitsCache = null;
let productsPromise = null;
let unitsPromise = null;
function mapProduct(row) {
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
function mapUnit(row) {
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
function cloneProducts(products) {
    return products.map((product) => ({ ...product }));
}
function cloneUnits(units) {
    return units.map((unit) => ({ ...unit }));
}
function setProductsCache(products) {
    productsCache = cloneProducts(products);
}
function setUnitsCache(units) {
    unitsCache = cloneUnits(units);
}
function clearProductsPromise() {
    productsPromise = null;
}
function clearUnitsPromise() {
    unitsPromise = null;
}
export function primeProductCache(products) {
    setProductsCache(products);
}
export function primeUnitsCache(units) {
    setUnitsCache(units);
}
export function invalidateInventoryCache() {
    productsCache = null;
    unitsCache = null;
    clearProductsPromise();
    clearUnitsPromise();
}
export function listProducts(options) {
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
            const mappedProducts = (data || []).map((row) => mapProduct(row));
            setProductsCache(mappedProducts);
            return cloneProducts(mappedProducts);
        }
        catch (error) {
            clearProductsPromise();
            throw error;
        }
        finally {
            clearProductsPromise();
        }
    })();
    return productsPromise;
}
export function listUnits(options) {
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
            const mappedUnits = (data || []).map((row) => mapUnit(row));
            setUnitsCache(mappedUnits);
            return cloneUnits(mappedUnits);
        }
        catch (error) {
            clearUnitsPromise();
            throw error;
        }
        finally {
            clearUnitsPromise();
        }
    })();
    return unitsPromise;
}
export async function createProduct(product) {
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
    const nextProduct = mapProduct(data);
    const nextProducts = [nextProduct, ...(productsCache || [])];
    setProductsCache(nextProducts);
    return nextProduct;
}
export async function updateProduct(productId, product) {
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
    const nextProduct = mapProduct(data);
    if (productsCache) {
        setProductsCache(productsCache.map((product) => (product.id === productId ? nextProduct : product)));
    }
    return nextProduct;
}
export async function deleteProduct(productId) {
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
export async function createUnit(unit) {
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
    const nextUnit = mapUnit(data);
    const nextUnits = [nextUnit, ...(unitsCache || [])];
    setUnitsCache(nextUnits);
    return nextUnit;
}
export async function updateUnitStatus(unitId, status) {
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
    const nextUnit = mapUnit(data);
    if (unitsCache) {
        setUnitsCache(unitsCache.map((unit) => (unit.id === unitId ? nextUnit : unit)));
    }
    return nextUnit;
}
export async function updateUnitQuantity(unitId, quantity) {
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
    const nextUnit = mapUnit(data);
    if (unitsCache) {
        setUnitsCache(unitsCache.map((unit) => (unit.id === unitId ? nextUnit : unit)));
    }
    return nextUnit;
}
export async function deleteUnit(unitId) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('units').delete().eq('id', unitId);
    if (error) {
        handleSupabaseError(error, OperationType.DELETE, `units/${unitId}`);
    }
    if (unitsCache) {
        setUnitsCache(unitsCache.filter((unit) => unit.id !== unitId));
    }
}
