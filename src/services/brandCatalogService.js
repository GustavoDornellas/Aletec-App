'use client';

import { PRODUCT_BRAND_OPTIONS } from '@/utils/produtoConstants';

const BRAND_CATALOG_STORAGE_KEY = 'aletech-brand-catalog-v1';

function normalizeBrandName(brand) {
  return String(brand ?? '').trim();
}

function sortBrands(brands) {
  return [...brands].sort((firstBrand, secondBrand) =>
    firstBrand.localeCompare(secondBrand, 'pt-BR')
  );
}

function buildUniqueBrands(brands) {
  const uniqueBrands = [];

  brands.forEach((brand) => {
    const normalizedBrand = normalizeBrandName(brand);

    if (!normalizedBrand) {
      return;
    }

    const hasBrand = uniqueBrands.some(
      (existingBrand) => existingBrand.toLowerCase() === normalizedBrand.toLowerCase()
    );

    if (!hasBrand) {
      uniqueBrands.push(normalizedBrand);
    }
  });

  return sortBrands(uniqueBrands);
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredCatalog() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawCatalog = window.localStorage.getItem(BRAND_CATALOG_STORAGE_KEY);

    if (!rawCatalog) {
      return [];
    }

    const parsedCatalog = JSON.parse(rawCatalog);

    if (!Array.isArray(parsedCatalog)) {
      return [];
    }

    return buildUniqueBrands(parsedCatalog);
  } catch {
    return [];
  }
}

export function saveBrandCatalog(brands) {
  const normalizedCatalog = buildUniqueBrands(brands);

  if (canUseStorage()) {
    window.localStorage.setItem(BRAND_CATALOG_STORAGE_KEY, JSON.stringify(normalizedCatalog));
  }

  return normalizedCatalog;
}

export function loadBrandCatalog(productBrands = []) {
  const storedCatalog = readStoredCatalog();
  const baseCatalog = storedCatalog.length > 0 ? storedCatalog : PRODUCT_BRAND_OPTIONS;

  return saveBrandCatalog([...baseCatalog, ...productBrands]);
}

export function addBrandToCatalog(brands, brandToAdd) {
  return saveBrandCatalog([...brands, brandToAdd]);
}

export function renameBrandInCatalog(brands, currentBrand, nextBrand) {
  return saveBrandCatalog(
    brands.map((brand) => (brand.toLowerCase() === currentBrand.toLowerCase() ? nextBrand : brand))
  );
}

export function replaceBrandInCatalog(brands, currentBrand, replacementBrand) {
  return saveBrandCatalog([
    ...brands.filter((brand) => brand.toLowerCase() !== currentBrand.toLowerCase()),
    replacementBrand,
  ]);
}
