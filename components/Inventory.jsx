'use client';
import React, { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Plus, Package, Trash2, Edit, Loader2, Search, Filter, Upload, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProductModal from './ProductModal';
import UnitModal from './UnitModal';
import { useFirebase } from './FirebaseProvider';
import { createProduct, createUnit, deleteProduct, deleteUnit, listProducts, listUnits, primeProductCache, primeUnitsCache, updateUnitStatus, } from '@/lib/inventory-store';
const STATUS_ALL = 'Todas';
const STATUS_AVAILABLE = `Dispon${String.fromCharCode(237)}vel pra venda`;
const STATUS_USED = 'Utilizada';
const STATUS_SOLD = 'Vendida';
const AVAILABLE_STATUS_VALUES = new Set([STATUS_AVAILABLE, 'DisponÃ­vel pra venda', 'Disponível pra venda']);
const USED_STATUS_VALUES = new Set(['Utilizada']);
const SOLD_STATUS_VALUES = new Set(['Vendida']);
const getStatusGroup = (status) => {
    if (AVAILABLE_STATUS_VALUES.has(status))
        return STATUS_AVAILABLE;
    if (USED_STATUS_VALUES.has(status))
        return STATUS_USED;
    if (SOLD_STATUS_VALUES.has(status))
        return STATUS_SOLD;
    return status;
};
const buildUnitsByProduct = (nextUnits) => nextUnits.reduce((acc, unit) => {
    if (!acc[unit.productId]) {
        acc[unit.productId] = [];
    }
    acc[unit.productId].push(unit);
    return acc;
}, {});
const mergeProductsWithUnits = (nextProducts, nextUnitsByProduct) => nextProducts.map((product) => {
    const productUnits = nextUnitsByProduct[product.id] || [];
    const total = productUnits.reduce((acc, unit) => acc + (unit.quantity || 1), 0);
    const available = productUnits
        .filter((unit) => getStatusGroup(unit.status) === STATUS_AVAILABLE)
        .reduce((acc, unit) => acc + (unit.quantity || 1), 0);
    const sold = productUnits
        .filter((unit) => getStatusGroup(unit.status) === STATUS_SOLD)
        .reduce((acc, unit) => acc + (unit.quantity || 1), 0);
    return {
        ...product,
        total,
        available,
        sold,
    };
});
const CSV_FIELDS = [
    { key: 'nome', label: 'Nome do Produto', aliases: ['nome', 'nome_do_produto', 'produto'] },
    { key: 'pn', label: 'PN', aliases: ['pn', 'part_number', 'modelo'] },
    { key: 'categoria', label: 'Categoria', aliases: ['categoria'] },
    { key: 'preco', label: 'Valor Unitario (R$)', aliases: ['preco', 'valor', 'valor_unitario', 'valor_unitario_r'] },
    { key: 'status_produto', label: 'Status do Produto', aliases: ['status_produto', 'status_do_produto'] },
    { key: 'serial', label: 'Codigo da placa', aliases: ['serial', 'serial_number', 'sn', 'codigo_da_placa'] },
    { key: 'status_unidade', label: 'Status da Unidade', aliases: ['status_unidade', 'status_da_unidade', 'status'] },
    { key: 'quantidade', label: 'Quantidade', aliases: ['quantidade', 'qtd'] },
];
const CSV_REQUIRED_FIELDS = ['nome', 'pn', 'categoria', 'preco', 'status_produto', 'serial', 'status_unidade', 'quantidade'];
const normalizeCsvValue = (value) => (value ?? '').replace(/\r/g, '').trim();
const normalizeCsvHeader = (value) => normalizeCsvValue(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
const CSV_HEADER_LOOKUP = new Map(CSV_FIELDS.flatMap((field) => [field.key, ...field.aliases, field.label].map((alias) => [normalizeCsvHeader(alias), field.key])));
const escapeCsvValue = (value) => {
    const normalized = String(value ?? '');
    if (/[",;\n]/.test(normalized)) {
        return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
};
const detectCsvDelimiter = (line) => {
    const commaCount = (line.match(/,/g) || []).length;
    const semicolonCount = (line.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
};
const parseCsvLine = (line, delimiter) => {
    const values = [];
    let current = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i += 1;
            }
            else {
                insideQuotes = !insideQuotes;
            }
            continue;
        }
        if (char === delimiter && !insideQuotes) {
            values.push(normalizeCsvValue(current));
            current = '';
            continue;
        }
        current += char;
    }
    values.push(normalizeCsvValue(current));
    return values;
};
const parseCsvContent = (content) => {
    const lines = content
        .replace(/^\uFEFF/, '')
        .split(/\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (lines.length < 2) {
        throw new Error('O CSV precisa ter cabecalho e ao menos uma linha de dados.');
    }
    const delimiter = detectCsvDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter).map((header) => {
        const normalizedHeader = normalizeCsvHeader(header);
        return CSV_HEADER_LOOKUP.get(normalizedHeader) || normalizedHeader;
    });
    const rows = lines.slice(1).map((line) => parseCsvLine(line, delimiter));
    return rows.map((row, index) => ({
        rowNumber: index + 2,
        entry: headers.reduce((acc, header, headerIndex) => {
            acc[header] = normalizeCsvValue(row[headerIndex]);
            return acc;
        }, {}),
    }));
};
export default function Inventory() {
    const { user, loading: authLoading } = useFirebase();
    const isAdmin = Boolean(user);
    const importInputRef = useRef(null);
    const [expandedId, setExpandedId] = useState(null);
    const [products, setProducts] = useState([]);
    const [units, setUnits] = useState({});
    const [loadingInventory, setLoadingInventory] = useState(true);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [importingCsv, setImportingCsv] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
    const deferredSearchTerm = useDeferredValue(searchTerm);
    useEffect(() => {
        let isMounted = true;
        const setup = async () => {
            try {
                const [nextProducts, nextUnits] = await Promise.all([listProducts(), listUnits()]);
                if (!isMounted)
                    return;
                const nextUnitsByProduct = buildUnitsByProduct(nextUnits);
                const nextProductsWithMetrics = mergeProductsWithUnits(nextProducts, nextUnitsByProduct);
                setProducts(nextProductsWithMetrics);
                setUnits(nextUnitsByProduct);
                primeProductCache(nextProductsWithMetrics);
                primeUnitsCache(nextUnits);
                setLoadingInventory(false);
            }
            catch {
                if (!isMounted)
                    return;
                setLoadingInventory(false);
            }
        };
        void setup();
        return () => {
            isMounted = false;
        };
    }, []);
    const showSuccess = (message) => {
        setFeedback({ type: 'success', message });
    };
    const showError = (message) => {
        setFeedback({ type: 'error', message });
    };
    const refreshInventory = async () => {
        const [nextProducts, nextUnits] = await Promise.all([listProducts({ force: true }), listUnits({ force: true })]);
        const nextUnitsByProduct = buildUnitsByProduct(nextUnits);
        const nextProductsWithMetrics = mergeProductsWithUnits(nextProducts, nextUnitsByProduct);
        setProducts(nextProductsWithMetrics);
        setUnits(nextUnitsByProduct);
        primeProductCache(nextProductsWithMetrics);
        primeUnitsCache(nextUnits);
    };
    const syncProductTotals = (targetProductId, nextUnitsByProduct) => {
        const productUnits = nextUnitsByProduct[targetProductId] || [];
        const total = productUnits.reduce((acc, unit) => acc + (unit.quantity || 1), 0);
        const available = productUnits
            .filter((unit) => getStatusGroup(unit.status) === STATUS_AVAILABLE)
            .reduce((acc, unit) => acc + (unit.quantity || 1), 0);
        const sold = productUnits
            .filter((unit) => getStatusGroup(unit.status) === STATUS_SOLD)
            .reduce((acc, unit) => acc + (unit.quantity || 1), 0);
        setProducts((currentProducts) => currentProducts.map((product) => product.id === targetProductId
            ? { ...product, total, available, sold, updatedAt: new Date().toISOString() }
            : product));
    };
    const handleProductSaved = (savedProduct, mode) => {
        setProducts((currentProducts) => {
            if (mode === 'create') {
                setSearchTerm('');
                setCategoryFilter('Todas');
                setStatusFilter(STATUS_ALL);
                return [savedProduct, ...currentProducts];
            }
            return currentProducts.map((product) => (product.id === savedProduct.id ? { ...product, ...savedProduct } : product));
        });
    };
    const handleUnitCreated = (createdUnit) => {
        setUnits((currentUnits) => {
            const nextUnits = {
                ...currentUnits,
                [createdUnit.productId]: [createdUnit, ...(currentUnits[createdUnit.productId] || [])],
            };
            syncProductTotals(createdUnit.productId, nextUnits);
            return nextUnits;
        });
    };
    const handleDeleteProduct = async (productId) => {
        await deleteProduct(productId);
        setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
        setUnits((currentUnits) => {
            const nextUnits = { ...currentUnits };
            delete nextUnits[productId];
            return nextUnits;
        });
    };
    const handleUnitStatusChange = async (unitId, nextStatus) => {
        const updatedUnit = await updateUnitStatus(unitId, nextStatus);
        setUnits((currentUnits) => {
            const nextUnits = Object.fromEntries(Object.entries(currentUnits).map(([productId, productUnits]) => [
                productId,
                productUnits.map((unit) => (unit.id === unitId ? updatedUnit : unit)),
            ]));
            syncProductTotals(updatedUnit.productId, nextUnits);
            return nextUnits;
        });
    };
    const handleDeleteUnit = async (unitToDelete) => {
        await deleteUnit(unitToDelete.id);
        setUnits((currentUnits) => {
            const nextUnits = {
                ...currentUnits,
                [unitToDelete.productId]: (currentUnits[unitToDelete.productId] || []).filter((unit) => unit.id !== unitToDelete.id),
            };
            syncProductTotals(unitToDelete.productId, nextUnits);
            return nextUnits;
        });
    };
    const filteredProducts = useMemo(() => {
        const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();
        return products.filter((product) => {
            const matchesCategory = categoryFilter === 'Todas' || product.category === categoryFilter;
            const matchesSearch = normalizedSearchTerm.length === 0 ||
                product.name.toLowerCase().includes(normalizedSearchTerm) ||
                product.pn.toLowerCase().includes(normalizedSearchTerm);
            const productUnits = units[product.id] || [];
            const matchesStatus = statusFilter === STATUS_ALL || productUnits.some((unit) => getStatusGroup(unit.status) === statusFilter);
            return matchesCategory && matchesSearch && matchesStatus;
        });
    }, [categoryFilter, deferredSearchTerm, products, statusFilter, units]);
    const filteredUnitsByProduct = useMemo(() => Object.fromEntries(filteredProducts.map((product) => {
        const productUnits = units[product.id] || [];
        const nextUnits = statusFilter === STATUS_ALL
            ? productUnits
            : productUnits.filter((unit) => getStatusGroup(unit.status) === statusFilter);
        return [product.id, nextUnits];
    })), [filteredProducts, statusFilter, units]);
    const inventoryValueForSale = useMemo(() => products.reduce((acc, product) => acc + (product.available || 0) * (product.price || 0), 0), [products]);
    const inventoryStats = useMemo(() => [
        { label: 'Total de Unidades', value: products.reduce((acc, p) => acc + (p.total || 0), 0).toLocaleString('pt-BR') },
        { label: 'Disponíveis p/ Venda', value: products.reduce((acc, p) => acc + (p.available || 0), 0).toLocaleString('pt-BR') },
        { label: 'Modelos de Placas', value: products.length.toString() },
        { label: 'Valor do estoque (R$)', value: inventoryValueForSale.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), highlight: true },
    ], [inventoryValueForSale, products]);
    const handleExportCsv = () => {
        const rows = [...products]
            .sort((a, b) => {
            const categoryOrder = a.category.localeCompare(b.category, 'pt-BR');
            if (categoryOrder !== 0)
                return categoryOrder;
            const nameOrder = a.name.localeCompare(b.name, 'pt-BR');
            if (nameOrder !== 0)
                return nameOrder;
            return a.pn.localeCompare(b.pn, 'pt-BR');
        })
            .flatMap((product) => {
            const productUnits = units[product.id] || [];
            if (productUnits.length === 0) {
                return [[product.name, product.pn, product.category, product.price.toFixed(2), product.status, '', '', '']];
            }
            return [...productUnits]
                .sort((a, b) => a.sn.localeCompare(b.sn, 'pt-BR'))
                .map((unit) => [
                product.name,
                product.pn,
                product.category,
                product.price.toFixed(2),
                product.status,
                unit.sn,
                unit.status,
                unit.quantity,
            ]);
        });
        const csvContent = [
            CSV_FIELDS.map((field) => field.label).join(';'),
            ...rows.map((row) => row.map((value) => escapeCsvValue(value)).join(';')),
        ].join('\r\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showSuccess('CSV exportado com sucesso.');
    };
    const handleImportButtonClick = () => {
        importInputRef.current?.click();
    };
    const handleImportCsv = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        setImportingCsv(true);
        try {
            const content = await file.text();
            const rows = parseCsvContent(content);
            const headerKeys = Object.keys(rows[0]?.entry || {});
            const missingHeaders = CSV_REQUIRED_FIELDS.filter((header) => !headerKeys.includes(header));
            if (missingHeaders.length > 0) {
                const missingLabels = missingHeaders.map((header) => CSV_FIELDS.find((field) => field.key === header)?.label || header);
                throw new Error(`CSV invalido. Faltam colunas: ${missingLabels.join(', ')}.`);
            }
            const productsByPn = new Map(products.map((product) => [product.pn.trim().toLowerCase(), product]));
            const existingUnits = new Set(Object.entries(units).flatMap(([productId, productUnits]) => productUnits.map((unit) => `${productId}:${unit.sn.trim().toLowerCase()}`)));
            const fileUnits = new Set();
            let importedProducts = 0;
            let importedUnits = 0;
            let skippedUnits = 0;
            for (const { rowNumber, entry } of rows) {
                const name = normalizeCsvValue(entry.nome);
                const pn = normalizeCsvValue(entry.pn);
                const category = normalizeCsvValue(entry.categoria) || 'Outros';
                const price = Number.parseFloat(normalizeCsvValue(entry.preco).replace(',', '.')) || 0;
                const productStatus = normalizeCsvValue(entry.status_produto) || 'Ativo';
                const serial = normalizeCsvValue(entry.serial);
                const unitStatus = normalizeCsvValue(entry.status_unidade) || STATUS_AVAILABLE;
                const quantity = Number.parseInt(normalizeCsvValue(entry.quantidade), 10) || 1;
                if (!name || !pn) {
                    throw new Error(`Linha ${rowNumber}: informe ao menos nome e PN.`);
                }
                const pnKey = pn.toLowerCase();
                let product = productsByPn.get(pnKey);
                if (!product) {
                    product = await createProduct({
                        name,
                        pn,
                        category,
                        price,
                        status: productStatus,
                        image: null,
                    });
                    productsByPn.set(pnKey, product);
                    importedProducts += 1;
                }
                if (!serial) {
                    continue;
                }
                const unitKey = `${product.id}:${serial.toLowerCase()}`;
                if (existingUnits.has(unitKey) || fileUnits.has(unitKey)) {
                    skippedUnits += 1;
                    continue;
                }
                await createUnit({
                    productId: product.id,
                    sn: serial,
                    status: unitStatus,
                    quantity,
                    image: null,
                });
                existingUnits.add(unitKey);
                fileUnits.add(unitKey);
                importedUnits += 1;
            }
            await refreshInventory();
            showSuccess(`Importacao concluida. ${importedProducts} produto(s) criado(s), ${importedUnits} unidade(s) importada(s)` +
                (skippedUnits > 0 ? ` e ${skippedUnits} unidade(s) ignorada(s) por duplicidade.` : '.'));
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Nao foi possivel importar o CSV.');
        }
        finally {
            setImportingCsv(false);
            event.target.value = '';
        }
    };
    if (authLoading || loadingInventory) {
        return (<div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-primary" size={32}/>
        <p className="text-slate-500 text-sm font-medium">Carregando inventário...</p>
      </div>);
    }
    return (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 [&_h2]:dark:text-blue-300 [&_p]:dark:text-blue-400/85">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-slate-900 tracking-tight">Inventário</h2>
          <p className="text-on-surface-variant font-medium text-sm mt-1 uppercase tracking-wider">
            Monitoramento da Logística
          </p>
        </div>
        {isAdmin && (<div className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
            <input ref={importInputRef} type="file" accept=".csv,text/csv" onChange={handleImportCsv} className="hidden"/>
            <div className="flex gap-2">
              <button onClick={handleImportButtonClick} disabled={importingCsv} className="bg-white text-slate-700 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-60 dark:bg-[#34322f] dark:text-zinc-100 dark:border-[#45413c] dark:hover:bg-[#3c3935]">
                {importingCsv ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>}
                Importar CSV
              </button>
              <button onClick={handleExportCsv} className="bg-white text-slate-700 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all dark:bg-[#34322f] dark:text-zinc-100 dark:border-[#45413c] dark:hover:bg-[#3c3935]">
                <Download size={16}/>
                Exportar CSV
              </button>
            </div>
            <button onClick={() => {
                startTransition(() => {
                    setSelectedProduct(null);
                    setIsProductModalOpen(true);
                });
            }} className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              <Plus size={18}/>
              Adicionar Item
            </button>
          </div>)}
      </div>

      {feedback && (<div className={`rounded-xl border px-4 py-3 text-sm font-medium ${feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'}`}>
          <div className="flex items-center justify-between gap-4">
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-xs font-bold uppercase tracking-wide opacity-70 hover:opacity-100">
              Fechar
            </button>
          </div>
        </div>)}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {inventoryStats.map((stat, i) => (<div key={i} className="bg-white p-5 md:p-6 rounded-xl border-b-2 border-primary/10 shadow-sm dark:bg-[#34322f] dark:border-blue-500/35">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 dark:text-blue-300/90">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl md:text-3xl font-black font-headline ${stat.highlight ? 'text-primary dark:text-blue-400' : 'text-on-surface dark:text-blue-300'}`}>{stat.value}</span>
            </div>
          </div>))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center dark:bg-[#34322f] dark:border-[#45413c]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-blue-300/75" size={18}/>
          <input type="text" placeholder="Pesquisar por modelo ou PN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none dark:bg-[#2f2c29] dark:border-[#4a4540] dark:text-blue-100 dark:placeholder:text-blue-200/40"/>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-blue-300/75" size={14}/>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-primary/20 outline-none dark:bg-[#2f2c29] dark:border-[#4a4540] dark:text-blue-100">
              <option value="Todas">Todas Categorias</option>
              <option value="Placa Principal">Placa Principal</option>
              <option value="Placa Fonte">Placa Fonte</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="relative flex-1 md:w-52">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-blue-300/75" size={14}/>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-primary/20 outline-none dark:bg-[#2f2c29] dark:border-[#4a4540] dark:text-blue-100">
              <option value={STATUS_ALL}>Todos Status</option>
              <option value={STATUS_AVAILABLE}>Disponível pra venda</option>
              <option value={STATUS_USED}>Utilizada</option>
              <option value={STATUS_SOLD}>Vendida</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 dark:bg-[#34322f] dark:border-[#45413c]">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-on-surface-variant border-b border-slate-100 dark:bg-[#2b2927] dark:border-[#45413c] dark:text-blue-300/90">
          <div className="col-span-1"></div>
          <div className="col-span-4">Produto</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-2 text-center">Quantidade</div>
          <div className="col-span-2 text-right">Preço Un. (R$)</div>
          <div className="col-span-1 text-center">Ações</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {filteredProducts.map((product) => {
            const filteredUnits = filteredUnitsByProduct[product.id] || [];
            return (<div key={product.id} className="contents">
                <div onClick={() => setExpandedId(expandedId === product.id ? null : product.id)} className="hidden md:grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors cursor-pointer group dark:hover:bg-zinc-800/40">
                  <div className="col-span-1 flex justify-center">
                    <ChevronDown size={20} className={`text-slate-400 transition-transform duration-200 ${expandedId === product.id ? 'rotate-180' : ''}`}/>
                  </div>
                  <div className="col-span-4 flex items-center gap-4">
                    <div className={`w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center p-2 relative overflow-hidden dark:bg-[#2f2c29] ${product.image ? 'cursor-zoom-in' : ''}`} onClick={(e) => {
                    if (!product.image)
                        return;
                    e.stopPropagation();
                    setPreviewImage({ src: product.image, alt: product.name });
                }}>
                      {product.image ? (<Image src={product.image} alt={product.name} fill className="object-contain p-1 mix-blend-multiply opacity-80" unoptimized referrerPolicy="no-referrer"/>) : (<Package size={24} className="text-slate-400 dark:text-blue-300/70"/>)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface font-headline leading-tight dark:text-blue-200">{product.name}</h4>
                      <p className="text-[10px] text-on-surface-variant font-medium tracking-tight dark:text-blue-300/75">PN: {product.pn}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] px-2 py-1 bg-slate-100 text-on-surface-variant rounded font-black uppercase tracking-wider dark:bg-[#2f2c29] dark:text-blue-200">
                      {product.category}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-sm dark:text-blue-200">{product.total || 0} Total</span>
                      <span className={`text-[9px] font-bold uppercase tracking-tighter ${(product.available || 0) === 0 ? 'text-error' : 'text-tertiary'}`}>
                        {product.available || 0} Disponíveis
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-headline font-bold text-sm dark:text-blue-300">
                    {product.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="col-span-1 flex justify-center gap-1">
                    {isAdmin ? (<>
                        <button onClick={(e) => {
                        e.stopPropagation();
                        startTransition(() => {
                            setSelectedProduct(product);
                            setIsProductModalOpen(true);
                        });
                    }} className="p-1.5 rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:text-zinc-400 dark:hover:bg-[#2f2c29]">
                          <Edit size={16}/>
                        </button>
                        <button onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(product.id);
                    }} className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-zinc-400 dark:hover:bg-[#2f2c29]">
                          <Trash2 size={16}/>
                        </button>
                      </>) : (<span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">View Only</span>)}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === product.id && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50/50 border-y border-slate-100 dark:bg-[#2b2927] dark:border-[#45413c]">
                      <div className="px-4 md:px-6 py-4 space-y-2">
                        <div className="flex items-center justify-between px-2 md:px-10 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest dark:text-blue-300/80">
                          <span>Codigo da placa</span>
                          <span className="hidden sm:inline">Estado Atual</span>
                          <div className="flex items-center gap-4">
                            <span className="hidden sm:inline">Controle de status</span>
                            {isAdmin && (<button onClick={() => {
                            startTransition(() => {
                                setSelectedProduct(product);
                                setIsUnitModalOpen(true);
                            });
                        }} className="flex items-center gap-1 text-primary hover:text-primary-dim transition-colors">
                                <Plus size={12}/>
                                Adicionar Item
                              </button>)}
                          </div>
                        </div>
                        {filteredUnits.map((unit) => (<div key={unit.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-10 py-3 bg-white rounded-lg border border-slate-200 shadow-sm gap-2 dark:bg-[#34322f] dark:border-[#45413c]">
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                              {unit.image && (<div className="relative w-10 h-10 rounded-md overflow-hidden border border-slate-200 flex-shrink-0 cursor-zoom-in dark:border-zinc-700" onClick={() => setPreviewImage({ src: unit.image, alt: `Serial ${unit.sn}` })}>
                                  <Image src={unit.image} alt={`Unit ${unit.sn}`} fill className="object-cover" unoptimized referrerPolicy="no-referrer"/>
                                </div>)}
                              <span className="text-xs font-mono font-bold text-on-surface dark:text-blue-200">{unit.sn}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${getStatusGroup(unit.status) === STATUS_AVAILABLE
                            ? 'bg-tertiary-container text-on-tertiary-container'
                            : getStatusGroup(unit.status) === STATUS_USED
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-primary/10 text-primary'}`}>
                                {unit.status} {unit.quantity > 1 && `(x${unit.quantity})`}
                              </span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                              {isAdmin ? (<>
                                  <select value={unit.status} onChange={(e) => {
                                void handleUnitStatusChange(unit.id, e.target.value)
                                    .then(() => showSuccess('Status atualizado com sucesso.'))
                                    .catch((error) => {
                                    showError(error instanceof Error ? error.message : 'Não foi possível atualizar o status.');
                                });
                            }} className="bg-slate-100 border-none text-[10px] font-bold rounded-md py-1 px-2 focus:ring-1 focus:ring-primary/30 flex-1 sm:flex-none dark:bg-[#2f2c29] dark:text-blue-100">
                                    <option>{STATUS_AVAILABLE}</option>
                                    <option>{STATUS_SOLD}</option>
                                    <option>{STATUS_USED}</option>
                                  </select>
                                  <button onClick={() => {
                                void handleDeleteUnit(unit)
                                    .then(() => showSuccess('Unidade removida com sucesso.'))
                                    .catch((error) => {
                                    showError(error instanceof Error ? error.message : 'Não foi possível remover a unidade.');
                                });
                            }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors dark:text-zinc-400">
                                    <Trash2 size={14}/>
                                  </button>
                                </>) : (<span className="text-[10px] text-slate-400 font-medium italic dark:text-blue-300/70">Somente leitura</span>)}
                            </div>
                          </div>))}
                        {filteredUnits.length === 0 && (<p className="text-center py-4 text-xs text-slate-400 dark:text-blue-300/65">Nenhuma unidade encontrada com os filtros atuais.</p>)}
                      </div>
                    </motion.div>)}
                </AnimatePresence>
              </div>);
        })}
          {filteredProducts.length === 0 && (<div className="p-12 text-center">
              <Package size={48} className="mx-auto text-slate-200 mb-4 dark:text-zinc-700"/>
              <p className="text-slate-500 font-medium dark:text-blue-300/65">Nenhum produto encontrado com os filtros selecionados.</p>
            </div>)}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between dark:bg-[#2b2927] dark:border-[#45413c]">
          <span className="text-xs font-medium text-slate-500 dark:text-blue-300/80">Exibindo {filteredProducts.length} modelos de produto</span>
        </div>
      </div>

      <ProductModal isOpen={isProductModalOpen} onClose={() => {
            startTransition(() => {
                setIsProductModalOpen(false);
                setSelectedProduct(null);
            });
        }} product={selectedProduct || undefined} onSuccess={showSuccess} onError={showError} onSaved={handleProductSaved}/>

      {selectedProduct && (<UnitModal isOpen={isUnitModalOpen} onClose={() => startTransition(() => {
                setIsUnitModalOpen(false);
            })} productId={selectedProduct.id} onSuccess={showSuccess} onError={showError} onCreated={handleUnitCreated}/>)}

      <AnimatePresence>
        {previewImage && (<div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setPreviewImage(null)} className="absolute right-3 top-3 z-10 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white">
                Fechar
              </button>
              <div className="overflow-hidden rounded-xl bg-slate-100">
                <img src={previewImage.src} alt={previewImage.alt} className="max-h-[80vh] w-full object-contain"/>
              </div>
            </motion.div>
          </div>)}

        {deleteConfirmId && (<div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6">
              <h3 className="font-headline font-bold text-lg text-slate-900 mb-2">Excluir Produto?</h3>
              <p className="text-slate-500 text-sm mb-6">Esta ação não pode ser desfeita. Todas as unidades vinculadas também serão removidas.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  Cancelar
                </button>
                <button onClick={() => {
                if (deleteConfirmId) {
                    void handleDeleteProduct(deleteConfirmId)
                        .then(() => {
                        setDeleteConfirmId(null);
                        showSuccess('Item removido com sucesso.');
                    })
                        .catch((error) => {
                        showError(error instanceof Error ? error.message : 'Não foi possível remover o item.');
                    });
                }
            }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>)}
      </AnimatePresence>
    </motion.div>);
}
