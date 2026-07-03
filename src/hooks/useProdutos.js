'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addBrandToCatalog,
  loadBrandCatalog,
  renameBrandInCatalog,
  replaceBrandInCatalog,
} from '@/services/brandCatalogService';
import {
  createProduto,
  deleteProduto,
  listProdutos,
  renameProdutoBrand,
  replaceProdutoBrand,
  updateProduto,
} from '@/services/produtoService';
import { listReturns, listSales } from '@/services/saleService';
import {
  createUnidade,
  deleteUnidade,
  listUnidades,
  updateUnidade,
  updateUnidadeBox,
  updateUnidadeQuantity,
  updateUnidadeSerial,
  updateUnidadeStatus,
} from '@/services/unidadeService';
import { mapCsvRowToPayload } from '@/utils/csv';
import { buildUnitsByProduct, createInventorySummary, enrichProducts } from '@/utils/inventory';

export function useProdutos() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [unitsByProduct, setUnitsByProduct] = useState({});
  const [sales, setSales] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  function buildInventoryData(productsResponse, unitsResponse, salesResponse, returnsResponse) {
    const nextUnitsByProduct = buildUnitsByProduct(unitsResponse.data);
    const nextProducts = enrichProducts(productsResponse.data, nextUnitsByProduct);

    return {
      products: nextProducts,
      unitsByProduct: nextUnitsByProduct,
      sales: salesResponse.data,
      returns: returnsResponse.data,
    };
  }

  const syncBrandCatalog = useCallback((nextProducts) => {
    setBrands(loadBrandCatalog(nextProducts.map((product) => product.brand || product.name)));
  }, []);

  function finishLoading() {
    setLoading(false);
    setRefreshing(false);
  }

  const fetchInventoryData = useCallback(async () => {
    const [productsResponse, unitsResponse, salesResponse, returnsResponse] = await Promise.all([
      listProdutos(),
      listUnidades(),
      listSales(),
      listReturns(),
    ]);

    const failedResponse = [productsResponse, unitsResponse, salesResponse, returnsResponse].find(
      (response) => !response.success
    );

    if (failedResponse) {
      return failedResponse;
    }

    return {
      success: true,
      data: buildInventoryData(productsResponse, unitsResponse, salesResponse, returnsResponse),
    };
  }, []);

  const applyInventoryData = useCallback((inventoryData) => {
    setProducts(inventoryData.products);
    syncBrandCatalog(inventoryData.products);
    setUnitsByProduct(inventoryData.unitsByProduct);
    setSales(inventoryData.sales);
    setReturns(inventoryData.returns);
  }, [syncBrandCatalog]);

  async function loadInventory(options = {}) {
    const shouldKeepScreen = options.keepScreen ?? false;
    setError('');

    if (shouldKeepScreen) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const response = await fetchInventoryData();

    if (!response.success) {
      setError(response.error.message);
      finishLoading();
      return response;
    }

    applyInventoryData(response.data);
    finishLoading();

    return response;
  }

  useEffect(() => {
    let isActive = true;

    async function initializeInventory() {
      setError('');
      setLoading(true);
      const response = await fetchInventoryData();

      if (!isActive) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
        setLoading(false);
        return;
      }

      applyInventoryData(response.data);
      setLoading(false);
    }

    void initializeInventory();

    return () => {
      isActive = false;
    };
  }, [applyInventoryData, fetchInventoryData]);

  async function saveProduct(product, currentProduct) {
    const normalizedBrand = String(product.brand ?? product.name ?? '').trim();
    const response = currentProduct?.id
      ? await updateProduto(currentProduct.id, product)
      : await createProduto(product);

    if (!response.success) {
      return response;
    }

    if (normalizedBrand) {
      setBrands((currentBrands) => addBrandToCatalog(currentBrands, normalizedBrand));
    }

    await loadInventory({ keepScreen: true });
    return response;
  }

  async function removeProduct(productId) {
    const response = await deleteProduto(productId);

    if (!response.success) {
      return response;
    }

    await loadInventory({ keepScreen: true });
    return response;
  }

  async function renameBrand(currentBrand, nextBrand) {
    const response = await renameProdutoBrand(currentBrand, nextBrand);

    if (!response.success) {
      return response;
    }

    setBrands((currentBrands) => renameBrandInCatalog(currentBrands, currentBrand, nextBrand));
    await loadInventory({ keepScreen: true });
    return response;
  }

  async function replaceBrand(currentBrand, replacementBrand) {
    const response = await replaceProdutoBrand(currentBrand, replacementBrand);

    if (!response.success) {
      return response;
    }

    setBrands((currentBrands) =>
      replaceBrandInCatalog(currentBrands, currentBrand, replacementBrand)
    );
    await loadInventory({ keepScreen: true });
    return response;
  }

  async function saveUnit(unit) {
    const response = unit.id
      ? await updateUnidade(unit.id, unit)
      : await createUnidade(unit);

    if (!response.success) {
      return response;
    }

    await loadInventory({ keepScreen: true });
    return response;
  }

  async function changeUnitStatus(unitId, status) {
    const response = await updateUnidadeStatus(unitId, status);

    if (!response.success) {
      return response;
    }

    await loadInventory({ keepScreen: true });
    return response;
  }

  async function changeUnitQuantity(unitId, quantity) {
    const response = await updateUnidadeQuantity(unitId, quantity);

    if (!response.success) {
      return response;
    }

    await loadInventory({ keepScreen: true });
    return response;
  }

  async function changeUnitBox(unitId, box) {
    const response = await updateUnidadeBox(unitId, box);

    if (!response.success) {
      return response;
    }

    await loadInventory({ keepScreen: true });
    return response;
  }

  async function changeUnitSerial(unitId, serial) {
    const response = await updateUnidadeSerial(unitId, serial);

    if (!response.success) {
      return response;
    }

    await loadInventory({ keepScreen: true });
    return response;
  }

  async function removeUnit(unitId) {
    const response = await deleteUnidade(unitId);

    if (!response.success) {
      return response;
    }

    await loadInventory({ keepScreen: true });
    return response;
  }

  async function importRows(rows, currentProducts) {
    const productsByKey = new Map(
      currentProducts.map((product) => [
        `${product.pn.trim().toLowerCase()}::${product.category.trim().toLowerCase()}`,
        product,
      ])
    );

    let importedProducts = 0;
    let importedUnits = 0;

    for (const row of rows) {
      const payload = mapCsvRowToPayload(row.entry);

      if (!payload.produto.name || !payload.produto.pn) {
        return {
          success: false,
          error: {
            message: `Linha ${row.rowNumber}: informe ao menos marca e PN.`,
          },
        };
      }

      const productKey = `${payload.produto.pn.trim().toLowerCase()}::${payload.produto.category
        .trim()
        .toLowerCase()}`;

      let product = productsByKey.get(productKey);

      if (!product) {
        const createProductResponse = await createProduto(payload.produto);

        if (!createProductResponse.success) {
          return {
            success: false,
            error: {
              message: `Linha ${row.rowNumber}: ${createProductResponse.error.message}`,
            },
          };
        }

        product = createProductResponse.data;
        productsByKey.set(productKey, product);
        importedProducts += 1;
      }

      if (!payload.unidade.sn) {
        continue;
      }

      const createUnitResponse = await createUnidade({
        ...payload.unidade,
        productId: product.id,
      });

      if (!createUnitResponse.success) {
        return {
          success: false,
          error: {
            message: `Linha ${row.rowNumber}: ${createUnitResponse.error.message}`,
          },
        };
      }

      importedUnits += createUnitResponse.data?.length || 1;
    }

    await loadInventory({ keepScreen: true });

    return {
      success: true,
      data: {
        importedProducts,
        importedUnits,
        skippedUnits: 0,
      },
    };
  }

  const summary = useMemo(
    () => createInventorySummary(products, sales, returns),
    [products, returns, sales]
  );

  return {
    products,
    brands,
    unitsByProduct,
    sales,
    returns,
    summary,
    error,
    loading,
    refreshing,
    loadInventory,
    saveProduct,
    removeProduct,
    renameBrand,
    replaceBrand,
    saveUnit,
    changeUnitStatus,
    changeUnitQuantity,
    changeUnitBox,
    changeUnitSerial,
    removeUnit,
    importRows,
  };
}
