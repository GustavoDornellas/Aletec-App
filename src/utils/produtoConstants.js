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

export const UNIT_STATUS_IN_STOCK = 'in_stock';
export const UNIT_STATUS_AVAILABLE = 'available';
export const UNIT_STATUS_USED = 'used';
export const UNIT_STATUS_SOLD = 'sold';
export const UNIT_STATUS_ALL = 'all';

export const UNIT_STATUS_OPTIONS = [
  UNIT_STATUS_IN_STOCK,
  UNIT_STATUS_AVAILABLE,
  UNIT_STATUS_USED,
  UNIT_STATUS_SOLD,
];

const UNIT_STATUS_LABELS = {
  [UNIT_STATUS_IN_STOCK]: 'Em estoque',
  [UNIT_STATUS_AVAILABLE]: 'Disponivel para venda',
  [UNIT_STATUS_USED]: 'Utilizada',
  [UNIT_STATUS_SOLD]: 'Vendida',
};

const UNIT_STATUS_VALUE_BY_KEY = new Map([
  [UNIT_STATUS_IN_STOCK, UNIT_STATUS_IN_STOCK],
  ['emestoque', UNIT_STATUS_IN_STOCK],
  ['estoque', UNIT_STATUS_IN_STOCK],
  ['instock', UNIT_STATUS_IN_STOCK],
  [UNIT_STATUS_AVAILABLE, UNIT_STATUS_AVAILABLE],
  ['disponivel', UNIT_STATUS_AVAILABLE],
  ['disponivelparavenda', UNIT_STATUS_AVAILABLE],
  ['disponivelpravenda', UNIT_STATUS_AVAILABLE],
  ['disponivelparavendas', UNIT_STATUS_AVAILABLE],
  ['disponivelpravendas', UNIT_STATUS_AVAILABLE],
  ['disponvelpravenda', UNIT_STATUS_AVAILABLE],
  ['disponvelparavenda', UNIT_STATUS_AVAILABLE],
  ['disponavelparavenda', UNIT_STATUS_AVAILABLE],
  ['disponavelpravenda', UNIT_STATUS_AVAILABLE],
  [UNIT_STATUS_USED, UNIT_STATUS_USED],
  ['utilizada', UNIT_STATUS_USED],
  ['utilizado', UNIT_STATUS_USED],
  ['usada', UNIT_STATUS_USED],
  ['usado', UNIT_STATUS_USED],
  [UNIT_STATUS_SOLD, UNIT_STATUS_SOLD],
  ['vendida', UNIT_STATUS_SOLD],
  ['vendido', UNIT_STATUS_SOLD],
]);

const LEGACY_DATABASE_STATUS_BY_VALUE = {
  [UNIT_STATUS_IN_STOCK]: [UNIT_STATUS_IN_STOCK],
  [UNIT_STATUS_AVAILABLE]: [
    'Dispon\u00c3\u00advel pra venda',
    'Dispon\u00edvel pra venda',
    'Dispon\u00edvel para venda',
    'Disponivel pra venda',
    'Disponivel para venda',
  ],
  [UNIT_STATUS_USED]: ['Utilizada'],
  [UNIT_STATUS_SOLD]: ['Vendida'],
};

function normalizeStatusKey(status) {
  return String(status ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

export function normalizeUnitStatus(status) {
  const normalizedKey = normalizeStatusKey(status);

  if (!normalizedKey) {
    return UNIT_STATUS_IN_STOCK;
  }

  if (UNIT_STATUS_VALUE_BY_KEY.has(normalizedKey)) {
    return UNIT_STATUS_VALUE_BY_KEY.get(normalizedKey);
  }

  if (normalizedKey.includes('estoque')) {
    return UNIT_STATUS_IN_STOCK;
  }

  if (normalizedKey.includes('dispon')) {
    return UNIT_STATUS_AVAILABLE;
  }

  if (normalizedKey.includes('util') || normalizedKey.includes('usad')) {
    return UNIT_STATUS_USED;
  }

  if (normalizedKey.includes('vend')) {
    return UNIT_STATUS_SOLD;
  }

  return UNIT_STATUS_IN_STOCK;
}

export function getUnitStatusLabel(status) {
  const normalizedStatus = normalizeUnitStatus(status);
  return UNIT_STATUS_LABELS[normalizedStatus] || UNIT_STATUS_LABELS[UNIT_STATUS_IN_STOCK];
}

export function getLegacyDatabaseUnitStatus(status) {
  const normalizedStatus = normalizeUnitStatus(status);

  return [
    ...new Set(
      LEGACY_DATABASE_STATUS_BY_VALUE[normalizedStatus] ||
        LEGACY_DATABASE_STATUS_BY_VALUE[UNIT_STATUS_IN_STOCK]
    ),
  ];
}

export function toDatabaseUnitStatus(status) {
  return normalizeUnitStatus(status);
}
