import {
  getUnitStatusLabel,
  normalizeUnitStatus,
  PRODUCT_CATEGORIES,
  UNIT_STATUS_ALL,
  UNIT_STATUS_AVAILABLE,
  UNIT_STATUS_SOLD,
} from '@/utils/produtoConstants';

function normalizeBoxLabel(box) {
  return String(box ?? '').trim();
}

function buildProductBoxSummary(boxes) {
  if (boxes.length === 0) {
    return 'Sem caixa informada';
  }

  if (boxes.length <= 2) {
    return boxes.join(', ');
  }

  return `${boxes.slice(0, 2).join(', ')} +${boxes.length - 2}`;
}

export function buildUnitsByProduct(units) {
  return units.reduce((accumulator, unit) => {
    if (!accumulator[unit.productId]) {
      accumulator[unit.productId] = [];
    }

    accumulator[unit.productId].push({
      ...unit,
      box: normalizeBoxLabel(unit.box),
      status: normalizeUnitStatus(unit.status),
    });

    return accumulator;
  }, {});
}

function getProductMetrics(productUnits) {
  return productUnits.reduce(
    (totals, unit) => {
      const quantity = unit.quantity || 1;
      const normalizedBox = normalizeBoxLabel(unit.box);

      totals.total += quantity;

      if (normalizeUnitStatus(unit.status) === UNIT_STATUS_AVAILABLE) {
        totals.available += quantity;
      }

      if (normalizeUnitStatus(unit.status) === UNIT_STATUS_SOLD) {
        totals.sold += quantity;
      }

      if (normalizedBox) {
        totals.boxes.add(normalizedBox);
      }

      return totals;
    },
    { total: 0, available: 0, sold: 0, boxes: new Set() }
  );
}

export function enrichProducts(products, unitsByProduct) {
  return products.map((product) => {
    const productUnits = unitsByProduct[product.id] || [];
    const metrics = getProductMetrics(productUnits);
    const boxes = [...metrics.boxes].sort((firstBox, secondBox) =>
      firstBox.localeCompare(secondBox, 'pt-BR')
    );

    return {
      ...product,
      total: metrics.total,
      available: metrics.available,
      sold: metrics.sold,
      boxes,
      boxSummary: buildProductBoxSummary(boxes),
    };
  });
}

export function createInventorySummary(products) {
  const totalUnits = products.reduce((total, product) => total + (product.total || 0), 0);
  const availableUnits = products.reduce(
    (total, product) => total + (product.available || 0),
    0
  );
  const soldUnits = products.reduce((total, product) => total + (product.sold || 0), 0);
  const inventoryValue = products.reduce(
    (total, product) => total + (product.available || 0) * (product.price || 0),
    0
  );
  const totalRevenue = products.reduce(
    (total, product) => total + (product.sold || 0) * (product.price || 0),
    0
  );

  return {
    totalProducts: products.length,
    totalUnits,
    availableUnits,
    soldUnits,
    inventoryValue,
    totalRevenue,
    categories: PRODUCT_CATEGORIES.map((category) => ({
      label: category,
      value: products.filter((product) => product.category === category).length,
    })),
  };
}

export function filterProducts(products, unitsByProduct, filters) {
  const normalizedSearch = filters.searchTerm.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory =
      filters.category === 'Todas' || product.category === filters.category;

    const matchesSearch =
      !normalizedSearch ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.pn.toLowerCase().includes(normalizedSearch);

    const productUnits = unitsByProduct[product.id] || [];
    const matchesStatus =
      filters.status === UNIT_STATUS_ALL ||
      productUnits.some((unit) => normalizeUnitStatus(unit.status) === filters.status);

    return matchesCategory && matchesSearch && matchesStatus;
  });
}

export function filterUnitsByStatus(unitsByProduct, productId, status) {
  const productUnits = unitsByProduct[productId] || [];

  if (status === UNIT_STATUS_ALL) {
    return productUnits;
  }

  return productUnits.filter((unit) => normalizeUnitStatus(unit.status) === status);
}

export function getInventoryStatusLabel(status) {
  if (status === UNIT_STATUS_ALL) {
    return 'Todos Status';
  }

  return getUnitStatusLabel(status);
}
