'use client';

import { Download, Filter, Plus, Search, Upload } from 'lucide-react';
import {
  PRODUCT_CATEGORIES,
  UNIT_STATUS_ALL,
  UNIT_STATUS_OPTIONS,
} from '@/utils/produtoConstants';

export function InventoryFilters({
  category,
  status,
  searchTerm,
  importing,
  refreshing,
  onCategoryChange,
  onStatusChange,
  onSearchChange,
  onCreateProduct,
  onImportCsv,
  onExportCsv,
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#45413c] dark:bg-[#34322f]">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-blue-50">
            Gerenciamento de Estoque
          </h3>
          <p className="text-sm text-slate-500 dark:text-blue-200/75">
            Consulte, cadastre e acompanhe os produtos e as unidades.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#4b4741] dark:text-blue-100 dark:hover:bg-[#2b2927]"
          >
            <Download size={16} />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={onImportCsv}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#4b4741] dark:text-blue-100 dark:hover:bg-[#2b2927]"
          >
            <Upload size={16} />
            {importing ? 'Importando...' : 'Importar CSV'}
          </button>

          <button
            type="button"
            onClick={onCreateProduct}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary-dim"
          >
            <Plus size={16} />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-blue-300/75" size={14} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por marca ou PN"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#4a4540] dark:bg-[#2f2c29] dark:text-blue-100"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-blue-300/75" size={14} />
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#4a4540] dark:bg-[#2f2c29] dark:text-blue-100"
          >
            <option value="Todas">Todas Categorias</option>
            {PRODUCT_CATEGORIES.map((categoryOption) => (
              <option key={categoryOption} value={categoryOption}>
                {categoryOption}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-blue-300/75" size={14} />
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#4a4540] dark:bg-[#2f2c29] dark:text-blue-100"
          >
            <option value={UNIT_STATUS_ALL}>Todos Status</option>
            {UNIT_STATUS_OPTIONS.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
