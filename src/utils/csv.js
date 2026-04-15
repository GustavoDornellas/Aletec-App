import {
  getUnitStatusLabel,
  normalizeUnitStatus,
  UNIT_STATUS_AVAILABLE,
} from '@/utils/produtoConstants';

export const CSV_FIELDS = [
  { key: 'nome', label: 'Marca', aliases: ['marca', 'nome', 'nome_do_produto', 'produto'] },
  { key: 'pn', label: 'PN', aliases: ['pn', 'part_number', 'modelo'] },
  { key: 'categoria', label: 'Categoria', aliases: ['categoria'] },
  { key: 'preco', label: 'Valor Unitario (R$)', aliases: ['preco', 'valor', 'valor_unitario'] },
  { key: 'status_produto', label: 'Status do Produto', aliases: ['status_produto'] },
  { key: 'serial', label: 'Codigo da placa', aliases: ['serial', 'sn', 'codigo_da_placa'] },
  { key: 'caixa', label: 'Caixa', aliases: ['caixa', 'box', 'localizacao'] },
  { key: 'status_unidade', label: 'Status da Unidade', aliases: ['status_unidade', 'status'] },
  { key: 'quantidade', label: 'Quantidade', aliases: ['quantidade', 'qtd'] },
];

export const CSV_REQUIRED_FIELDS = [
  'nome',
  'pn',
  'categoria',
  'preco',
  'status_produto',
  'serial',
  'status_unidade',
  'quantidade',
];

export function normalizeCsvValue(value) {
  return String(value ?? '').replace(/\r/g, '').trim();
}

function normalizeCsvHeader(value) {
  return normalizeCsvValue(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const headerLookup = new Map(
  CSV_FIELDS.flatMap((field) =>
    [field.key, ...field.aliases, field.label].map((alias) => [
      normalizeCsvHeader(alias),
      field.key,
    ])
  )
);

export function escapeCsvValue(value) {
  const normalized = String(value ?? '');

  if (/[",;\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function detectDelimiter(line) {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;

  return semicolonCount > commaCount ? ';' : ',';
}

function parseCsvLine(line, delimiter) {
  const values = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (character === delimiter && !insideQuotes) {
      values.push(normalizeCsvValue(current));
      current = '';
      continue;
    }

    current += character;
  }

  values.push(normalizeCsvValue(current));

  return values;
}

export function parseCsvContent(content) {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('O CSV precisa ter cabecalho e ao menos uma linha de dados.');
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((header) => {
    const normalizedHeader = normalizeCsvHeader(header);
    return headerLookup.get(normalizedHeader) || normalizedHeader;
  });

  const missingHeaders = CSV_REQUIRED_FIELDS.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    const missingLabels = missingHeaders.map((header) => {
      return CSV_FIELDS.find((field) => field.key === header)?.label || header;
    });

    throw new Error(`CSV invalido. Faltam colunas: ${missingLabels.join(', ')}.`);
  }

  return lines.slice(1).map((line, rowIndex) => {
    const row = parseCsvLine(line, delimiter);

    return {
      rowNumber: rowIndex + 2,
      entry: headers.reduce((accumulator, header, headerIndex) => {
        accumulator[header] = normalizeCsvValue(row[headerIndex]);
        return accumulator;
      }, {}),
    };
  });
}

export function buildInventoryCsv(products, unitsByProduct) {
  const rows = [...products]
    .sort((firstProduct, secondProduct) => {
      const categoryOrder = firstProduct.category.localeCompare(secondProduct.category, 'pt-BR');

      if (categoryOrder !== 0) {
        return categoryOrder;
      }

      const nameOrder = firstProduct.name.localeCompare(secondProduct.name, 'pt-BR');

      if (nameOrder !== 0) {
        return nameOrder;
      }

      return firstProduct.pn.localeCompare(secondProduct.pn, 'pt-BR');
    })
    .flatMap((product) => {
      const productUnits = unitsByProduct[product.id] || [];

      if (productUnits.length === 0) {
        return [
          [
            product.name,
            product.pn,
            product.category,
            product.price.toFixed(2),
            product.status,
            '',
            '',
            '',
            '',
          ],
        ];
      }

      return [...productUnits]
        .sort((firstUnit, secondUnit) => firstUnit.sn.localeCompare(secondUnit.sn, 'pt-BR'))
        .map((unit) => [
          product.name,
          product.pn,
          product.category,
          product.price.toFixed(2),
          product.status,
          unit.sn,
          unit.box || '',
          getUnitStatusLabel(unit.status),
          unit.quantity,
        ]);
    });

  return [
    CSV_FIELDS.map((field) => field.label).join(';'),
    ...rows.map((row) => row.map((value) => escapeCsvValue(value)).join(';')),
  ].join('\r\n');
}

export function mapCsvRowToPayload(entry) {
  return {
    produto: {
      name: normalizeCsvValue(entry.nome),
      pn: normalizeCsvValue(entry.pn),
      category: normalizeCsvValue(entry.categoria) || 'Outros',
      price: Number.parseFloat(normalizeCsvValue(entry.preco).replace(',', '.')) || 0,
      status: normalizeCsvValue(entry.status_produto) || 'Ativo',
      image: null,
    },
    unidade: {
      sn: normalizeCsvValue(entry.serial),
      box: normalizeCsvValue(entry.caixa),
      status: normalizeUnitStatus(normalizeCsvValue(entry.status_unidade) || UNIT_STATUS_AVAILABLE),
      quantity: Number.parseInt(normalizeCsvValue(entry.quantidade), 10) || 1,
      image: null,
    },
  };
}
