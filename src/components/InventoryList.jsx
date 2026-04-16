'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Edit, Package, Plus, Trash2 } from 'lucide-react';
import {
  getUnitStatusLabel,
  normalizeUnitStatus,
  UNIT_STATUS_IN_STOCK,
  UNIT_STATUS_AVAILABLE,
  UNIT_STATUS_USED,
} from '@/utils/produtoConstants';

function getStatusBadgeClass(status) {
  if (normalizeUnitStatus(status) === UNIT_STATUS_IN_STOCK) {
    return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100';
  }

  if (normalizeUnitStatus(status) === UNIT_STATUS_AVAILABLE) {
    return 'bg-tertiary-container text-on-tertiary-container';
  }

  if (normalizeUnitStatus(status) === UNIT_STATUS_USED) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-primary/10 text-primary';
}

export function InventoryList({
  expandedId,
  deletingProductId,
  deletingUnitId,
  filteredProducts,
  getVisibleUnits,
  onAddUnit,
  onDeleteProduct,
  onDeleteUnit,
  onEditProduct,
  onEditUnit,
  onPreviewImage,
  onToggleExpanded,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm dark:border-[#45413c] dark:bg-[#34322f]">
      <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:border-[#45413c] dark:bg-[#2b2927] dark:text-blue-300/90 md:grid">
        <div className="col-span-1" />
        <div className="col-span-4">Produto</div>
        <div className="col-span-2">Categoria</div>
        <div className="col-span-2 text-center">Quantidade</div>
        <div className="col-span-2 text-right">Preco Un. (R$)</div>
        <div className="col-span-1 text-center">Acoes</div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-zinc-800">
        {filteredProducts.map((product) => {
          const visibleUnits = getVisibleUnits(product.id);

          return (
            <div key={product.id} className="contents">
              <div className="px-4 py-4 md:hidden">
                <div
                  onClick={() => onToggleExpanded(product.id)}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm transition-colors dark:border-[#45413c] dark:bg-[#2b2927]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-2 dark:bg-[#2f2c29] ${product.image ? 'cursor-zoom-in' : ''}`}
                        onClick={(event) => {
                          if (!product.image) {
                            return;
                          }

                          event.stopPropagation();
                          onPreviewImage({ src: product.image, alt: product.name });
                        }}
                      >
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain p-1 mix-blend-multiply opacity-80"
                            unoptimized
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Package size={24} className="text-slate-400 dark:text-blue-300/70" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold leading-tight text-on-surface dark:text-blue-200">
                          {product.name}
                        </h4>
                        <p className="truncate text-[11px] font-medium text-on-surface-variant dark:text-blue-300/75">
                          PN: {product.pn}
                        </p>
                        <div className="mt-2">
                          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant dark:bg-[#2f2c29] dark:text-blue-200">
                            {product.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronDown
                      size={20}
                      className={`mt-1 shrink-0 text-slate-400 transition-transform duration-200 ${expandedId === product.id ? 'rotate-180' : ''}`}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-[#45413c] dark:bg-[#34322f]">
                      <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant dark:text-blue-300/80">
                        Quantidade
                      </p>
                      <p className="mt-1 text-sm font-bold text-on-surface dark:text-blue-200">
                        {product.total || 0} Total
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-500 dark:text-blue-300/75">
                        {product.inStock || 0} Em estoque
                      </p>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-tighter ${
                          (product.available || 0) === 0 ? 'text-error' : 'text-tertiary'
                        }`}
                      >
                        {product.available || 0} Anunciadas
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-blue-300/75">
                        Caixa: {product.boxSummary || 'Sem caixa informada'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-[#45413c] dark:bg-[#34322f]">
                      <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant dark:text-blue-300/80">
                        Preco
                      </p>
                      <p className="mt-1 text-sm font-bold text-on-surface dark:text-blue-200">
                        R$ {product.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditProduct(product);
                      }}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-[#2f2c29]"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteProduct(product.id);
                      }}
                      disabled={deletingProductId === product.id}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-[#2f2c29]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div
                onClick={() => onToggleExpanded(product.id)}
                className="hidden cursor-pointer grid-cols-12 items-center gap-4 px-6 py-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 md:grid"
              >
                <div className="col-span-1 flex justify-center">
                  <ChevronDown
                    size={20}
                    className={`text-slate-400 transition-transform duration-200 ${expandedId === product.id ? 'rotate-180' : ''}`}
                  />
                </div>

                <div className="col-span-4 flex items-center gap-4">
                  <div
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 p-2 dark:bg-[#2f2c29] ${product.image ? 'cursor-zoom-in' : ''}`}
                    onClick={(event) => {
                      if (!product.image) {
                        return;
                      }

                      event.stopPropagation();
                      onPreviewImage({ src: product.image, alt: product.name });
                    }}
                  >
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain p-1 mix-blend-multiply opacity-80"
                        unoptimized
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package size={24} className="text-slate-400 dark:text-blue-300/70" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold leading-tight text-on-surface dark:text-blue-200">
                      {product.name}
                    </h4>
                    <p className="text-[10px] font-medium tracking-tight text-on-surface-variant dark:text-blue-300/75">
                      PN: {product.pn}
                    </p>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant dark:bg-[#2f2c29] dark:text-blue-200">
                    {product.category}
                  </span>
                </div>

                <div className="col-span-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold dark:text-blue-200">{product.total || 0} Total</span>
                    <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 dark:text-blue-300/75">
                      {product.inStock || 0} Em estoque
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-tighter ${
                        (product.available || 0) === 0 ? 'text-error' : 'text-tertiary'
                      }`}
                    >
                      {product.available || 0} Anunciadas
                    </span>
                    <span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-blue-300/75">
                      Caixa: {product.boxSummary || 'Sem caixa informada'}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 text-right text-sm font-bold dark:text-blue-300">
                  {product.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>

                <div className="col-span-1 flex justify-center gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditProduct(product);
                    }}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-[#2f2c29]"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteProduct(product.id);
                    }}
                    disabled={deletingProductId === product.id}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-[#2f2c29]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === product.id ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-y border-slate-100 bg-slate-50/50 dark:border-[#45413c] dark:bg-[#2b2927]"
                  >
                    <div className="space-y-2 px-4 py-4 md:px-6">
                      <div className="flex items-center justify-between px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-blue-300/80 md:px-10">
                        <span>Codigo da placa</span>
                        <span className="hidden sm:inline">Estado Atual</span>
                        <div className="flex items-center gap-4">
                          <span className="hidden sm:inline">Quantidade e status</span>
                          <button
                            type="button"
                            onClick={() => onAddUnit(product)}
                            className="flex items-center gap-1 text-primary transition-colors hover:text-primary-dim"
                          >
                            <Plus size={12} />
                            Adicionar Item
                          </button>
                        </div>
                      </div>

                      {visibleUnits.map((unit) => {
                        return (
                          <div
                            key={unit.id}
                            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-[#45413c] dark:bg-[#34322f]"
                          >
                            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                              <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                                {unit.image ? (
                                  <div
                                    className="relative h-10 w-10 shrink-0 cursor-zoom-in overflow-hidden rounded-md border border-slate-200 dark:border-zinc-700"
                                    onClick={() => onPreviewImage({ src: unit.image, alt: `Serial ${unit.sn}` })}
                                  >
                                    <Image
                                      src={unit.image}
                                      alt={`Unit ${unit.sn}`}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                ) : null}

                                <span className="text-xs font-bold text-on-surface dark:text-blue-200">
                                  {unit.sn}
                                </span>

                                <span
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${getStatusBadgeClass(
                                    unit.status
                                  )}`}
                                >
                                  {getUnitStatusLabel(unit.status)}
                                  {unit.quantity > 1 ? ` (x${unit.quantity})` : ''}
                                </span>
                              </div>

                              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-blue-200/80">
                                  Caixa: {unit.box || 'Sem caixa'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-blue-200/80">
                                  Quantidade: {unit.quantity || 1}
                                </span>
                                <div className="flex w-full justify-end gap-2 sm:w-auto">
                                  <button
                                    type="button"
                                    onClick={() => onEditUnit(unit, product)}
                                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-[#2f2c29]"
                                    aria-label={`Editar unidade ${unit.sn}`}
                                  >
                                    <Edit size={14} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onDeleteUnit(unit)}
                                    disabled={deletingUnitId === unit.id}
                                    className="p-1.5 text-slate-400 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {visibleUnits.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-400 dark:text-blue-300/65">
                          Nenhuma unidade encontrada com os filtros atuais.
                        </p>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-slate-200 dark:text-zinc-700" />
            <p className="font-medium text-slate-500 dark:text-blue-300/65">
              Nenhum produto encontrado com os filtros selecionados.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-[#45413c] dark:bg-[#2b2927]">
        <span className="text-xs font-medium text-slate-500 dark:text-blue-300/80">
          Exibindo {filteredProducts.length} modelos de produto
        </span>
      </div>
    </div>
  );
}
