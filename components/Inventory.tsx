'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Plus, Package, Trash2, Edit, Loader2, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProductModal from './ProductModal';
import UnitModal from './UnitModal';
import { useFirebase } from './FirebaseProvider';
import {
  deleteProduct,
  deleteUnit,
  listProducts,
  listUnits,
  primeProductCache,
  primeUnitsCache,
  Product,
  Unit,
  updateUnitStatus,
} from '@/lib/inventory-store';

const STATUS_ALL = 'Todas';
const STATUS_AVAILABLE = `Dispon${String.fromCharCode(237)}vel pra venda`;
const STATUS_USED = 'Utilizada';
const STATUS_SOLD = 'Vendida';

const AVAILABLE_STATUS_VALUES = new Set([STATUS_AVAILABLE, 'DisponÃ­vel pra venda', 'Disponível pra venda']);
const USED_STATUS_VALUES = new Set(['Utilizada']);
const SOLD_STATUS_VALUES = new Set(['Vendida']);

const getStatusGroup = (status: string) => {
  if (AVAILABLE_STATUS_VALUES.has(status)) return STATUS_AVAILABLE;
  if (USED_STATUS_VALUES.has(status)) return STATUS_USED;
  if (SOLD_STATUS_VALUES.has(status)) return STATUS_SOLD;
  return status;
};

const buildUnitsByProduct = (nextUnits: Unit[]) =>
  nextUnits.reduce<Record<string, Unit[]>>((acc, unit) => {
    if (!acc[unit.productId]) {
      acc[unit.productId] = [];
    }

    acc[unit.productId].push(unit);
    return acc;
  }, {});

const mergeProductsWithUnits = (nextProducts: Product[], nextUnitsByProduct: Record<string, Unit[]>) =>
  nextProducts.map((product) => {
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

export default function Inventory() {
  const { user, loading: authLoading } = useFirebase();
  const isAdmin = Boolean(user);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Record<string, Unit[]>>({});
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        const [nextProducts, nextUnits] = await Promise.all([listProducts(), listUnits()]);
        if (!isMounted) return;

        const nextUnitsByProduct = buildUnitsByProduct(nextUnits);
        const nextProductsWithMetrics = mergeProductsWithUnits(nextProducts, nextUnitsByProduct);

        setProducts(nextProductsWithMetrics);
        setUnits(nextUnitsByProduct);
        primeProductCache(nextProductsWithMetrics);
        primeUnitsCache(nextUnits);
        setLoadingInventory(false);
      } catch {
        if (!isMounted) return;
        setLoadingInventory(false);
      }
    };

    void setup();

    return () => {
      isMounted = false;
    };
  }, []);

  const showSuccess = (message: string) => {
    setFeedback({ type: 'success', message });
  };

  const showError = (message: string) => {
    setFeedback({ type: 'error', message });
  };

  const syncProductTotals = (targetProductId: string, nextUnitsByProduct: Record<string, Unit[]>) => {
    const productUnits = nextUnitsByProduct[targetProductId] || [];
    const total = productUnits.reduce((acc, unit) => acc + (unit.quantity || 1), 0);
    const available = productUnits
      .filter((unit) => getStatusGroup(unit.status) === STATUS_AVAILABLE)
      .reduce((acc, unit) => acc + (unit.quantity || 1), 0);
    const sold = productUnits
      .filter((unit) => getStatusGroup(unit.status) === STATUS_SOLD)
      .reduce((acc, unit) => acc + (unit.quantity || 1), 0);

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === targetProductId
          ? { ...product, total, available, sold, updatedAt: new Date().toISOString() }
          : product
      )
    );
  };

  const handleProductSaved = (savedProduct: Product, mode: 'create' | 'update') => {
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

  const handleUnitCreated = (createdUnit: Unit) => {
    setUnits((currentUnits) => {
      const nextUnits = {
        ...currentUnits,
        [createdUnit.productId]: [createdUnit, ...(currentUnits[createdUnit.productId] || [])],
      };

      syncProductTotals(createdUnit.productId, nextUnits);
      return nextUnits;
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct(productId);
    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
    setUnits((currentUnits) => {
      const nextUnits = { ...currentUnits };
      delete nextUnits[productId];
      return nextUnits;
    });
  };

  const handleUnitStatusChange = async (unitId: string, nextStatus: string) => {
    const updatedUnit = await updateUnitStatus(unitId, nextStatus);
    setUnits((currentUnits) => {
      const nextUnits = Object.fromEntries(
        Object.entries(currentUnits).map(([productId, productUnits]) => [
          productId,
          productUnits.map((unit) => (unit.id === unitId ? updatedUnit : unit)),
        ])
      );

      syncProductTotals(updatedUnit.productId, nextUnits);
      return nextUnits;
    });
  };

  const handleDeleteUnit = async (unitToDelete: Unit) => {
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

  const filteredProducts = products.filter((product) => {
    const matchesCategory = categoryFilter === 'Todas' || product.category === categoryFilter;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.pn.toLowerCase().includes(searchTerm.toLowerCase());
    const productUnits = units[product.id] || [];
    const matchesStatus =
      statusFilter === STATUS_ALL || productUnits.some((unit) => getStatusGroup(unit.status) === statusFilter);

    return matchesCategory && matchesSearch && matchesStatus;
  });

  const getFilteredUnits = (productId: string) => {
    const productUnits = units[productId] || [];
    if (statusFilter === STATUS_ALL) return productUnits;
    return productUnits.filter((unit) => getStatusGroup(unit.status) === statusFilter);
  };

  const inventoryValueForSale = products.reduce((acc, product) => acc + (product.available || 0) * (product.price || 0), 0);

  if (authLoading || loadingInventory) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-slate-500 text-sm font-medium">Carregando inventário...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-slate-900 tracking-tight">Inventário</h2>
          <p className="text-on-surface-variant font-medium text-sm mt-1 uppercase tracking-wider">
            Monitoramento da Logística
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsProductModalOpen(true);
            }}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={18} />
            Adicionar Item
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold uppercase tracking-wide opacity-70 hover:opacity-100"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total de Unidades', value: products.reduce((acc, p) => acc + (p.total || 0), 0).toLocaleString('pt-BR') },
          { label: 'Disponíveis p/ Venda', value: products.reduce((acc, p) => acc + (p.available || 0), 0).toLocaleString('pt-BR') },
          { label: 'Modelos de Placas', value: products.length.toString() },
          { label: 'Valor para Venda (R$)', value: inventoryValueForSale.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), highlight: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 md:p-6 rounded-xl border-b-2 border-primary/10 shadow-sm">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl md:text-3xl font-black font-headline ${stat.highlight ? 'text-primary' : 'text-on-surface'}`}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por modelo ou PN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="Todas">Todas Categorias</option>
              <option value="Placa Principal">Placa Principal</option>
              <option value="Placa Fonte">Placa Fonte</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="relative flex-1 md:w-52">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value={STATUS_ALL}>Todos Status</option>
              <option value={STATUS_AVAILABLE}>Disponível pra venda</option>
              <option value={STATUS_USED}>Utilizada</option>
              <option value={STATUS_SOLD}>Vendida</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-on-surface-variant border-b border-slate-100">
          <div className="col-span-1"></div>
          <div className="col-span-4">Produto & PN</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-2 text-center">Quantidade</div>
          <div className="col-span-2 text-right">Preço Un. (R$)</div>
          <div className="col-span-1 text-center">Ações</div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredProducts.map((product) => {
            const filteredUnits = getFilteredUnits(product.id);

            return (
              <div key={product.id} className="contents">
                <div
                  onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                  className="hidden md:grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  <div className="col-span-1 flex justify-center">
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 transition-transform duration-200 ${expandedId === product.id ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <div className="col-span-4 flex items-center gap-4">
                    <div
                      className={`w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center p-2 relative overflow-hidden ${
                        product.image ? 'cursor-zoom-in' : ''
                      }`}
                      onClick={(e) => {
                        if (!product.image) return;
                        e.stopPropagation();
                        setPreviewImage({ src: product.image, alt: product.name });
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
                        <Package size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface font-headline leading-tight">{product.name}</h4>
                      <p className="text-[10px] text-on-surface-variant font-medium tracking-tight">PN: {product.pn}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] px-2 py-1 bg-slate-100 text-on-surface-variant rounded font-black uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-sm">{product.total || 0} Total</span>
                      <span className={`text-[9px] font-bold uppercase tracking-tighter ${(product.available || 0) === 0 ? 'text-error' : 'text-tertiary'}`}>
                        {product.available || 0} Disponíveis
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-headline font-bold text-sm">
                    {product.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="col-span-1 flex justify-center gap-1">
                    {isAdmin ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(product.id);
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">View Only</span>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === product.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-50/50 border-y border-slate-100"
                    >
                      <div className="px-4 md:px-6 py-4 space-y-2">
                        <div className="flex items-center justify-between px-2 md:px-10 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Serial Number</span>
                          <span className="hidden sm:inline">Estado Atual</span>
                          <div className="flex items-center gap-4">
                            <span className="hidden sm:inline">Unit Status Control</span>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsUnitModalOpen(true);
                                }}
                                className="flex items-center gap-1 text-primary hover:text-primary-dim transition-colors"
                              >
                                <Plus size={12} />
                                Adicionar Item
                              </button>
                            )}
                          </div>
                        </div>
                        {filteredUnits.map((unit) => (
                          <div key={unit.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-10 py-3 bg-white rounded-lg border border-slate-200 shadow-sm gap-2">
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                              {unit.image && (
                                <div
                                  className="relative w-10 h-10 rounded-md overflow-hidden border border-slate-200 flex-shrink-0 cursor-zoom-in"
                                  onClick={() => setPreviewImage({ src: unit.image!, alt: `Serial ${unit.sn}` })}
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
                              )}
                              <span className="text-xs font-mono font-bold text-on-surface">{unit.sn}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  getStatusGroup(unit.status) === STATUS_AVAILABLE
                                    ? 'bg-tertiary-container text-on-tertiary-container'
                                    : getStatusGroup(unit.status) === STATUS_USED
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {unit.status} {unit.quantity > 1 && `(x${unit.quantity})`}
                              </span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                              {isAdmin ? (
                                <>
                                  <select
                                    value={unit.status}
                                    onChange={(e) => {
                                      void handleUnitStatusChange(unit.id, e.target.value)
                                        .then(() => showSuccess('Status atualizado com sucesso.'))
                                        .catch((error: unknown) => {
                                          showError(error instanceof Error ? error.message : 'Não foi possível atualizar o status.');
                                        });
                                    }}
                                    className="bg-slate-100 border-none text-[10px] font-bold rounded-md py-1 px-2 focus:ring-1 focus:ring-primary/30 flex-1 sm:flex-none"
                                  >
                                    <option>{STATUS_AVAILABLE}</option>
                                    <option>{STATUS_SOLD}</option>
                                    <option>{STATUS_USED}</option>
                                  </select>
                                  <button
                                    onClick={() => {
                                      void handleDeleteUnit(unit)
                                        .then(() => showSuccess('Unidade removida com sucesso.'))
                                        .catch((error: unknown) => {
                                          showError(error instanceof Error ? error.message : 'Não foi possível remover a unidade.');
                                        });
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium italic">Somente leitura</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {filteredUnits.length === 0 && (
                          <p className="text-center py-4 text-xs text-slate-400">Nenhuma unidade encontrada com os filtros atuais.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="p-12 text-center">
              <Package size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">Nenhum produto encontrado com os filtros selecionados.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Exibindo {filteredProducts.length} modelos de produto</span>
        </div>
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct || undefined}
        onSuccess={showSuccess}
        onError={showError}
        onSaved={handleProductSaved}
      />

      {selectedProduct && (
        <UnitModal
          isOpen={isUnitModalOpen}
          onClose={() => setIsUnitModalOpen(false)}
          productId={selectedProduct.id}
          onSuccess={showSuccess}
          onError={showError}
          onCreated={handleUnitCreated}
        />
      )}

      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white"
              >
                Fechar
              </button>
              <div className="overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={previewImage.src}
                  alt={previewImage.alt}
                  className="max-h-[80vh] w-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}

        {deleteConfirmId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6"
            >
              <h3 className="font-headline font-bold text-lg text-slate-900 mb-2">Excluir Produto?</h3>
              <p className="text-slate-500 text-sm mb-6">Esta ação não pode ser desfeita. Todas as unidades vinculadas também serão removidas.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirmId) {
                      void handleDeleteProduct(deleteConfirmId)
                        .then(() => {
                          setDeleteConfirmId(null);
                          showSuccess('Item removido com sucesso.');
                        })
                        .catch((error: unknown) => {
                          showError(error instanceof Error ? error.message : 'Não foi possível remover o item.');
                        });
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


