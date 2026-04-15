'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Banknote, Boxes, Package, ShoppingCart } from 'lucide-react';
import { buildInventoryCsv, parseCsvContent } from '@/utils/csv';
import {
  createInventorySummary,
  filterProducts,
  filterUnitsByStatus,
} from '@/utils/inventory';
import { UNIT_STATUS_ALL } from '@/utils/produtoConstants';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FeedbackAlert } from '@/components/FeedbackAlert';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import { InventoryFilters } from '@/components/InventoryFilters';
import { InventoryList } from '@/components/InventoryList';
import { ProductModal } from '@/components/ProductModal';
import { UnitModal } from '@/components/UnitModal';

export function InventoryView({
  brands = [],
  products = [],
  unitsByProduct = {},
  inventoryError = '',
  refreshing = false,
  onImportRows = async () => ({ success: false, error: { message: 'Importacao indisponivel.' } }),
  onRemoveProduct = async () => ({ success: false, error: { message: 'Remocao indisponivel.' } }),
  onRenameBrand = async () => ({ success: false, error: { message: 'Atualizacao indisponivel.' } }),
  onReplaceBrand = async () => ({ success: false, error: { message: 'Atualizacao indisponivel.' } }),
  onRemoveUnit = async () => ({ success: false, error: { message: 'Remocao indisponivel.' } }),
  onSaveProduct = async () => ({ success: false, error: { message: 'Salvamento indisponivel.' } }),
  onSaveUnit = async () => ({ success: false, error: { message: 'Salvamento indisponivel.' } }),
}) {
  const importInputRef = useRef(null);
  const [expandedId, setExpandedId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState(UNIT_STATUS_ALL);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [deletingUnitId, setDeletingUnitId] = useState(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedback]);

  const filteredProducts = useMemo(() => {
    return filterProducts(products, unitsByProduct, {
      searchTerm: deferredSearchTerm,
      category: categoryFilter,
      status: statusFilter,
    });
  }, [categoryFilter, deferredSearchTerm, products, statusFilter, unitsByProduct]);

  const inventorySummary = useMemo(() => createInventorySummary(products), [products]);

  function showFeedback(nextFeedback) {
    setFeedback(nextFeedback);
  }

  function getVisibleUnits(productId) {
    return filterUnitsByStatus(unitsByProduct, productId, statusFilter);
  }

  function handleExportCsv() {
    const csvContent = buildInventoryCsv(products, unitsByProduct);
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showFeedback({
      type: 'success',
      message: 'CSV exportado com sucesso.',
    });
  }

  function handleImportButtonClick() {
    importInputRef.current?.click();
  }

  async function handleImportCsv(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);

    try {
      const content = await file.text();
      const rows = parseCsvContent(content);
      const response = await onImportRows(rows, products, unitsByProduct);

      if (!response.success) {
        showFeedback({
          type: 'error',
          message: response.error.message,
        });
        setIsImporting(false);
        event.target.value = '';
        return;
      }

      showFeedback({
        type: 'success',
        message:
          `${response.data.importedProducts} produto(s) criado(s), ` +
          `${response.data.importedUnits} unidade(s) importada(s)` +
          (response.data.skippedUnits > 0
            ? ` e ${response.data.skippedUnits} unidade(s) ignorada(s) por duplicidade.`
            : '.'),
      });
    } catch (error) {
      showFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel importar o CSV.',
      });
    }

    setIsImporting(false);
    event.target.value = '';
  }

  async function handleDeleteProduct() {
    if (!deleteConfirmId) {
      return;
    }

    setDeletingProductId(deleteConfirmId);
    const response = await onRemoveProduct(deleteConfirmId);

    if (!response.success) {
      showFeedback({
        type: 'error',
        message: response.error.message,
      });
      setDeletingProductId(null);
      return;
    }

    showFeedback({
      type: 'success',
      message: response.message,
    });
    setDeleteConfirmId(null);
    setDeletingProductId(null);
  }

  async function handleDeleteUnit(unit) {
    setDeletingUnitId(unit.id);
    const response = await onRemoveUnit(unit.id);

    if (!response.success) {
      showFeedback({
        type: 'error',
        message: response.error.message,
      });
      setDeletingUnitId(null);
      return;
    }

    showFeedback({
      type: 'success',
      message: response.message,
    });
    setDeletingUnitId(null);
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <FeedbackAlert
        feedback={feedback || (inventoryError ? { type: 'error', message: inventoryError } : null)}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: 'Total de unidades',
            value: inventorySummary.totalUnits.toLocaleString('pt-BR'),
            sub: `${inventorySummary.totalProducts} modelos cadastrados`,
            icon: Boxes,
          },
          {
            label: 'Disponiveis',
            value: inventorySummary.availableUnits.toLocaleString('pt-BR'),
            sub: 'Prontas para venda',
            icon: Package,
          },
          {
            label: 'Vendidas',
            value: inventorySummary.soldUnits.toLocaleString('pt-BR'),
            sub: 'Saida registrada',
            icon: ShoppingCart,
          },
          {
            label: 'Valor em estoque',
            value: `R$ ${inventorySummary.inventoryValue.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}`,
            sub: 'Baseado nas unidades disponiveis',
            icon: Banknote,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#45413c] dark:bg-[#34322f]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/80">
                  {card.label}
                </p>
                <p className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-blue-50 md:text-2xl">
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-blue-200/70">
                  {card.sub}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <card.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <InventoryFilters
        category={categoryFilter}
        status={statusFilter}
        searchTerm={searchTerm}
        importing={isImporting}
        refreshing={refreshing}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchTerm}
        onCreateProduct={() => {
          setSelectedProduct(null);
          setIsProductModalOpen(true);
        }}
        onImportCsv={handleImportButtonClick}
        onExportCsv={handleExportCsv}
      />

      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleImportCsv}
        className="hidden"
      />

      <InventoryList
        expandedId={expandedId}
        deletingProductId={deletingProductId}
        deletingUnitId={deletingUnitId}
        filteredProducts={filteredProducts}
        getVisibleUnits={getVisibleUnits}
        onAddUnit={(product) => {
          setSelectedProduct(product);
          setSelectedUnit(null);
          setIsUnitModalOpen(true);
        }}
        onDeleteProduct={setDeleteConfirmId}
        onDeleteUnit={handleDeleteUnit}
        onEditProduct={(product) => {
          setSelectedProduct(product);
          setIsProductModalOpen(true);
        }}
        onEditUnit={(unit, product) => {
          setSelectedProduct(product);
          setSelectedUnit(unit);
          setIsUnitModalOpen(true);
        }}
        onPreviewImage={setPreviewImage}
        onToggleExpanded={(productId) =>
          setExpandedId((currentId) => (currentId === productId ? null : productId))
        }
      />

      <ProductModal
        existingBrands={brands}
        isOpen={isProductModalOpen}
        product={selectedProduct}
        onRenameBrand={onRenameBrand}
        onReplaceBrand={onReplaceBrand}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={onSaveProduct}
        onFeedback={showFeedback}
      />

      <UnitModal
        key={selectedUnit?.id || selectedProduct?.id || 'new-unit'}
        isOpen={isUnitModalOpen}
        productId={selectedProduct?.id}
        unit={selectedUnit}
        onClose={() => {
          setIsUnitModalOpen(false);
          setSelectedUnit(null);
        }}
        onSave={onSaveUnit}
        onFeedback={showFeedback}
      />

      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />

      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        title="Excluir Produto?"
        description="Esta acao nao pode ser desfeita. Todas as unidades vinculadas tambem serao removidas."
        confirmLabel="Excluir"
        isLoading={Boolean(deleteConfirmId && deletingProductId === deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteProduct}
      />
    </div>
  );
}
