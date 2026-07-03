import {
  getUnitStatusLabel,
  normalizeUnitStatus,
  PRODUCT_CATEGORIES,
  UNIT_STATUS_ALL,
  UNIT_STATUS_IN_STOCK,
  UNIT_STATUS_ANNOUNCED,
  UNIT_STATUS_SOLD,
  UNIT_STATUS_RETURNED,
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

      if (normalizeUnitStatus(unit.status) === UNIT_STATUS_IN_STOCK) {
        totals.inStock += quantity;
      }

      if (normalizeUnitStatus(unit.status) === UNIT_STATUS_ANNOUNCED) {
        totals.available += quantity;
      }

      if (normalizeUnitStatus(unit.status) === UNIT_STATUS_SOLD) {
        totals.sold += quantity;
      }

      if (normalizeUnitStatus(unit.status) === UNIT_STATUS_RETURNED) {
        totals.returned += quantity;
      }

      if (normalizedBox) {
        totals.boxes.add(normalizedBox);
      }

      return totals;
    },
    { total: 0, inStock: 0, available: 0, sold: 0, returned: 0, boxes: new Set() }
  );
}

function getReturnSaleIds(returns) {
  return new Set(
    (Array.isArray(returns) ? returns : [])
      .map((returnRecord) => returnRecord.saleId)
      .filter(Boolean)
  );
}

function getCompletedSales(sales, returns) {
  const returnedSaleIds = getReturnSaleIds(returns);

  return (Array.isArray(sales) ? sales : []).filter((sale) => {
    return sale?.id && !returnedSaleIds.has(sale.id);
  });
}

function parseDateOnly(date) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function isSameMonth(date, referenceDate) {
  return (
    date &&
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  );
}

function createSalesSummary(sales, returns, referenceDate = new Date()) {
  const completedSales = getCompletedSales(sales, returns);
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  return completedSales.reduce(
    (totals, sale) => {
      const soldValue = Number(sale.soldValue || 0);
      const netValue = Number(sale.netValue || 0);
      const receiptDate = parseDateOnly(sale.receiptDate);

      totals.soldValue += Number.isFinite(soldValue) ? soldValue : 0;

      if (receiptDate && isSameMonth(receiptDate, today)) {
        totals.receivedThisMonth += Number.isFinite(netValue) ? netValue : 0;
      }

      if (!receiptDate || receiptDate > today) {
        totals.futureEarnings += Number.isFinite(netValue) ? netValue : 0;
      }

      return totals;
    },
    {
      soldValue: 0,
      futureEarnings: 0,
      receivedThisMonth: 0,
    }
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
      inStock: metrics.inStock,
      available: metrics.available,
      sold: metrics.sold,
      returned: metrics.returned,
      boxes,
      boxSummary: buildProductBoxSummary(boxes),
    };
  });
}

export function createInventorySummary(products, sales = [], returns = []) {
  const totalUnits = products.reduce((total, product) => total + (product.total || 0), 0);
  const inStockUnits = products.reduce((total, product) => total + (product.inStock || 0), 0);
  const availableUnits = products.reduce(
    (total, product) => total + (product.available || 0),
    0
  );
  const soldUnits = products.reduce((total, product) => total + (product.sold || 0), 0);
  const returnedUnits = products.reduce((total, product) => total + (product.returned || 0), 0);
  const inventoryValue = products.reduce(
    (total, product) => total + (product.inStock || 0) * (product.price || 0),
    0
  );
  const announcedValue = products.reduce(
    (total, product) => total + (product.available || 0) * (product.price || 0),
    0
  );
  const salesSummary = createSalesSummary(sales, returns);

  return {
    totalProducts: products.length,
    totalUnits,
    inStockUnits,
    availableUnits,
    soldUnits,
    returnedUnits,
    inventoryValue,
    announcedValue,
    soldValue: salesSummary.soldValue,
    futureEarnings: salesSummary.futureEarnings,
    receivedThisMonth: salesSummary.receivedThisMonth,
    categories: PRODUCT_CATEGORIES.map((category) => ({
      label: category,
      value: products.filter((product) => product.category === category).length,
    })),
  };
}

export function createSoldBrandBreakdown(products, sales = [], returns = []) {
  const completedSales = getCompletedSales(sales, returns);

  if (completedSales.length > 0) {
    const soldByBrand = completedSales.reduce((accumulator, sale) => {
      const brand = String(sale.product?.brand || sale.product?.name || 'Sem marca').trim() || 'Sem marca';

      if (!accumulator[brand]) {
        accumulator[brand] = 0;
      }

      accumulator[brand] += 1;
      return accumulator;
    }, {});

    return buildSoldBrandBreakdown(soldByBrand);
  }

  const safeProducts = Array.isArray(products) ? products : [];

  const soldByBrand = safeProducts.reduce((accumulator, product) => {
    if (!product || typeof product !== 'object') {
      return accumulator;
    }

    const soldUnits = Number(product.sold || 0);
    const brand = String(product.brand || product.name || 'Sem marca').trim() || 'Sem marca';

    if (!Number.isFinite(soldUnits) || soldUnits <= 0) {
      return accumulator;
    }

    if (!accumulator[brand]) {
      accumulator[brand] = 0;
    }

    accumulator[brand] += soldUnits;
    return accumulator;
  }, {});

  return buildSoldBrandBreakdown(soldByBrand);
}

function buildSoldBrandBreakdown(soldByBrand) {
  const totalSold = Object.values(soldByBrand).reduce((total, value) => total + value, 0);

  const breakdown = Object.entries(soldByBrand)
    .map(([brand, value]) => ({
      brand,
      value,
      percentage: totalSold > 0 ? (value / totalSold) * 100 : 0,
    }))
    .sort((firstBrand, secondBrand) => {
      if (secondBrand.value !== firstBrand.value) {
        return secondBrand.value - firstBrand.value;
      }

      return firstBrand.brand.localeCompare(secondBrand.brand, 'pt-BR');
    });

  const breakdownWithRoundedPercentage = breakdown.map((brand, index) => {
    if (index === breakdown.length - 1) {
      const allocatedPercentage = breakdown
        .slice(0, index)
        .reduce((total, item) => total + Math.round(item.percentage), 0);

      return {
        ...brand,
        percentage: Math.max(0, 100 - allocatedPercentage),
      };
    }

    return {
      ...brand,
      percentage: Math.round(brand.percentage),
    };
  });

  return {
    totalSold,
    breakdown: breakdownWithRoundedPercentage,
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
