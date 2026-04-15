export const PRODUCT_CATEGORIES = ['Placa Principal', 'Placa Fonte', 'Outros'];

export const PRODUCT_BRAND_OPTIONS = [
  'Samsung',
  'LG',
  'Philco',
  'Philips',
  'Sony',
  'Semp Toshiba',
];

export const PRODUCT_STATUS_ACTIVE = 'Ativo';

export const UNIT_STATUS_AVAILABLE = 'Disponivel para venda';
export const UNIT_STATUS_USED = 'Utilizada';
export const UNIT_STATUS_SOLD = 'Vendida';
export const UNIT_STATUS_ALL = 'Todas';

// Legacy value expected by current database constraint/triggers.
const DB_LEGACY_UNIT_STATUS_AVAILABLE = 'DisponÃ­vel pra venda';

export const UNIT_STATUS_OPTIONS = [
  UNIT_STATUS_AVAILABLE,
  UNIT_STATUS_USED,
  UNIT_STATUS_SOLD,
];

const AVAILABLE_STATUS_VALUES = new Set([
  UNIT_STATUS_AVAILABLE,
  'Disponivel pra venda',
  'Disponível pra venda',
  'Disponivel para venda',
  'Disponível para venda',
  DB_LEGACY_UNIT_STATUS_AVAILABLE,
  'DisponÃ­vel para venda',
]);

export function normalizeUnitStatus(status) {
  if (AVAILABLE_STATUS_VALUES.has(status)) {
    return UNIT_STATUS_AVAILABLE;
  }

  if (status === UNIT_STATUS_USED) {
    return UNIT_STATUS_USED;
  }

  if (status === UNIT_STATUS_SOLD) {
    return UNIT_STATUS_SOLD;
  }

  return status || UNIT_STATUS_AVAILABLE;
}

export function toDatabaseUnitStatus(status) {
  if (normalizeUnitStatus(status) === UNIT_STATUS_AVAILABLE) {
    return DB_LEGACY_UNIT_STATUS_AVAILABLE;
  }

  return normalizeUnitStatus(status);
}
