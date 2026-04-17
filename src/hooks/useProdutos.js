'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  function buildInventoryData(productsResponse, unitsResponse) {
    const nextUnitsByProduct = buildUnitsByProduct(unitsResponse.data);
    const nextProducts = enrichProducts(productsResponse.data, nextUnitsByProduct);

    return {
      products: nextProducts,
      unitsByProduct: nextUnitsByProduct,
    };
  }

  function syncBrandCatalog(nextProducts) {
    setBrands(loadBrandCatalog(nextProducts.map((product) => product.brand || product.name)));
  }

  function finishLoading() {
    setLoading(false);
    setRefreshing(false);
  }

  async function loadInventory(options = {}) {
    const shouldKeepScreen = options.keepScreen ?? false;
    setError('');

    if (shouldKeepScreen) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const [productsResponse, unitsResponse] = await Promise.all([listProdutos(), listUnidades()]);

    if (!productsResponse.success) {
      setError(productsResponse.error.message);
      finishLoading();
      return productsResponse;
    }

    if (!unitsResponse.success) {
      setError(unitsResponse.error.message);
      finishLoading();
      return unitsResponse;
    }

    const inventoryData = buildInventoryData(productsResponse, unitsResponse);

    setProducts(inventoryData.products);
    syncBrandCatalog(inventoryData.products);
    setUnitsByProduct(inventoryData.unitsByProduct);
    finishLoading();

    return {
      success: true,
      data: inventoryData,
    };
  }

  useEffect(() => {
    let isActive = true;

    async function initializeInventory() {
      const [productsResponse, unitsResponse] = await Promise.all([listProdutos(), listUnidades()]);

      if (!isActive) {
        return;
      }

      if (!productsResponse.success || !unitsResponse.success) {
        setError(
          productsResponse.error?.message ||
            unitsResponse.error?.message ||
            'Nao foi possivel carregar o inventario.'
        );
        setLoading(false);
        return;
      }

      const inventoryData = buildInventoryData(productsResponse, unitsResponse);

      setProducts(inventoryData.products);
      syncBrandCatalog(inventoryData.products);
      setUnitsByProduct(inventoryData.unitsByProduct);
      setLoading(false);
    }

    void initializeInventory();

    return () => {
      isActive = false;
    };
  }, []);

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

  const summary = useMemo(() => createInventorySummary(products), [products]);

  return {
    products,
    brands,
    unitsByProduct,
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
