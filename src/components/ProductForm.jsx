'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  PRODUCT_BRAND_OPTIONS,
  PRODUCT_CATEGORIES,
} from '@/utils/produtoConstants';
import { resizeImage } from '@/utils/image';

const ADD_BRAND_OPTION = '__add-new-brand__';

function buildInitialFormData(product) {
  if (!product) {
    return {
      name: '',
      pn: '',
      category: PRODUCT_CATEGORIES[0],
      price: '',
      status: 'Ativo',
      image: '',
    };
  }

  return {
    name: product.brand || product.name || '',
    pn: product.pn || '',
    category: product.category || PRODUCT_CATEGORIES[0],
    price: product.price?.toString() || '',
    status: product.status || 'Ativo',
    image: product.image || '',
  };
}

function buildBrandOptions(existingBrands = [], currentBrand = '') {
  return [...new Set([...PRODUCT_BRAND_OPTIONS, ...existingBrands, currentBrand].filter(Boolean))].sort(
    (firstBrand, secondBrand) => firstBrand.localeCompare(secondBrand, 'pt-BR')
  );
}

export function ProductForm({
  product,
  existingBrands = [],
  isSubmitting,
  fieldErrors = {},
  onCancel,
  onSubmit,
  onFeedback,
}) {
  const [formData, setFormData] = useState(() => buildInitialFormData(product));
  const [imageName, setImageName] = useState(() => (product?.image ? 'Imagem atual' : ''));
  const [customBrand, setCustomBrand] = useState('');
  const [customBrands, setCustomBrands] = useState([]);
  const [editingCustomBrand, setEditingCustomBrand] = useState(null);
  const [editingCustomBrandValue, setEditingCustomBrandValue] = useState('');
  const [isAddingBrand, setIsAddingBrand] = useState(false);

  const brandOptions = useMemo(() => {
    return buildBrandOptions([...existingBrands, ...customBrands], formData.name);
  }, [customBrands, existingBrands, formData.name]);

  async function handleImageFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      onFeedback?.({
        type: 'error',
        message: 'Selecione um arquivo de imagem valido.',
      });
      event.target.value = '';
      return;
    }

    try {
      const resizedImage = await resizeImage(file, {
        maxSide: 640,
        quality: 0.62,
        maxLength: 220000,
      });

      setFormData((current) => ({ ...current, image: resizedImage }));
      setImageName(file.name);
    } catch (error) {
      onFeedback?.({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar a imagem selecionada.',
      });
      setFormData((current) => ({ ...current, image: '' }));
      setImageName('');
      event.target.value = '';
    }
  }

  function handleBrandChange(event) {
    const nextValue = event.target.value;

    if (nextValue === ADD_BRAND_OPTION) {
      setIsAddingBrand(true);
      return;
    }

    setIsAddingBrand(false);
    setCustomBrand('');
    setFormData((current) => ({ ...current, name: nextValue }));
  }

  function handleAddBrand() {
    const normalizedBrand = customBrand.trim();

    if (!normalizedBrand) {
      onFeedback?.({
        type: 'error',
        message: 'Informe o nome da nova marca.',
      });
      return;
    }

    const hasBrand = brandOptions.some(
      (brand) => brand.toLowerCase() === normalizedBrand.toLowerCase()
    );

    if (!hasBrand) {
      setCustomBrands((current) => [...current, normalizedBrand]);
    }

    setFormData((current) => ({ ...current, name: normalizedBrand }));
    setCustomBrand('');
    setIsAddingBrand(false);
    onFeedback?.({
      type: 'success',
      message: `Marca "${normalizedBrand}" adicionada a lista.`,
    });
  }

  function startEditingCustomBrand(brand) {
    setEditingCustomBrand(brand);
    setEditingCustomBrandValue(brand);
  }

  function cancelEditingCustomBrand() {
    setEditingCustomBrand(null);
    setEditingCustomBrandValue('');
  }

  function handleSaveEditedCustomBrand(previousBrand) {
    const normalizedBrand = editingCustomBrandValue.trim();

    if (!normalizedBrand) {
      onFeedback?.({
        type: 'error',
        message: 'Informe um nome valido para a marca.',
      });
      return;
    }

    const hasDuplicateBrand = brandOptions.some(
      (brand) =>
        brand.toLowerCase() === normalizedBrand.toLowerCase() &&
        brand.toLowerCase() !== previousBrand.toLowerCase()
    );

    if (hasDuplicateBrand) {
      onFeedback?.({
        type: 'error',
        message: 'Essa marca ja existe na lista.',
      });
      return;
    }

    setCustomBrands((current) =>
      current.map((brand) => (brand === previousBrand ? normalizedBrand : brand))
    );

    if (formData.name === previousBrand) {
      setFormData((current) => ({ ...current, name: normalizedBrand }));
    }

    cancelEditingCustomBrand();
    onFeedback?.({
      type: 'success',
      message: `Marca "${previousBrand}" atualizada para "${normalizedBrand}".`,
    });
  }

  function handleRemoveCustomBrand(brandToRemove) {
    setCustomBrands((current) => current.filter((brand) => brand !== brandToRemove));

    if (formData.name === brandToRemove) {
      setFormData((current) => ({ ...current, name: '' }));
    }

    if (editingCustomBrand === brandToRemove) {
      cancelEditingCustomBrand();
    }

    onFeedback?.({
      type: 'success',
      message: `Marca "${brandToRemove}" removida da lista.`,
    });
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    onSubmit({
      ...formData,
      brand: formData.name,
      price: Number.parseFloat(String(formData.price).replace(',', '.')),
      image: formData.image || null,
    });
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-blue-200/80">
            Marca
          </label>
          <select
            required
            value={formData.name || ''}
            onChange={handleBrandChange}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 transition-all focus:ring-2 focus:ring-primary/20 dark:border-[#4a4540] dark:bg-[#2f2c29] dark:text-blue-50"
          >
            <option value="" disabled>
              Selecione a marca
            </option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
            <option value={ADD_BRAND_OPTION}>Adicionar nova marca</option>
          </select>
          {fieldErrors.nome ? (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.nome}</p>
          ) : null}
        </div>

        {isAddingBrand ? (
          <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3 dark:border-[#4a4540] dark:bg-[#2b2927]">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-blue-200/80">
              Nova marca
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={customBrand}
                onChange={(event) => setCustomBrand(event.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 transition-all focus:ring-2 focus:ring-primary/20 dark:border-[#4a4540] dark:bg-[#34322f] dark:text-blue-50"
                placeholder="Digite a marca que deseja adicionar"
              />
              <button
                type="button"
                onClick={handleAddBrand}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-all hover:bg-primary-dim"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>

            {customBrands.length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-[#4a4540] dark:bg-[#34322f]">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-blue-200/80">
                  Marcas adicionadas neste cadastro
                </p>

                <div className="space-y-2">
                  {customBrands.map((brand) => {
                    const isEditing = editingCustomBrand === brand;

                    return (
                      <div
                        key={brand}
                        className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-[#4a4540] dark:bg-[#2f2c29] sm:flex-row sm:items-center sm:justify-between"
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingCustomBrandValue}
                            onChange={(event) => setEditingCustomBrandValue(event.target.value)}
                            className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 dark:border-[#4a4540] dark:bg-[#34322f] dark:text-blue-50"
                          />
                        ) : (
                          <span className="text-sm font-medium text-slate-700 dark:text-blue-100">
                            {brand}
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedCustomBrand(brand)}
                                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-bold text-on-primary transition-all hover:bg-primary-dim"
                              >
                                <Check size={12} />
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditingCustomBrand}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100 dark:border-[#4a4540] dark:text-blue-100 dark:hover:bg-[#3a3734]"
                              >
                                <X size={12} />
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditingCustomBrand(brand)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100 dark:border-[#4a4540] dark:text-blue-100 dark:hover:bg-[#3a3734]"
                              >
                                <Pencil size={12} />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomBrand(brand)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 transition-all hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30"
                              >
                                <Trash2 size={12} />
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-blue-200/80">
            Modelo
          </label>
          <input
            required
            type="text"
            value={formData.pn}
            onChange={(event) => setFormData({ ...formData, pn: event.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 transition-all focus:ring-2 focus:ring-primary/20 dark:border-[#4a4540] dark:bg-[#2f2c29] dark:text-blue-50"
            placeholder="Ex: CTR-9902-LX"
          />
          {fieldErrors.pn ? (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.pn}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-blue-200/80">
            Valor (R$)
          </label>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={formData.price}
            onChange={(event) => setFormData({ ...formData, price: event.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 transition-all focus:ring-2 focus:ring-primary/20 dark:border-[#4a4540] dark:bg-[#2f2c29] dark:text-blue-50"
            placeholder="0.00"
          />
          {fieldErrors.preco ? (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.preco}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-blue-200/80">
          Categoria
        </label>
        <select
          value={formData.category}
          onChange={(event) => setFormData({ ...formData, category: event.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 transition-all focus:ring-2 focus:ring-primary/20 dark:border-[#4a4540] dark:bg-[#2f2c29] dark:text-blue-50"
        >
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        {fieldErrors.category ? (
          <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.category}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-blue-200/80">
          Foto do Modelo (Opcional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageFileChange}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary dark:border-[#4a4540] dark:bg-[#2f2c29] dark:text-blue-100"
        />

        {imageName ? (
          <p className="mt-2 text-xs font-medium text-slate-500 dark:text-blue-200/75">
            Imagem selecionada: {imageName}
          </p>
        ) : null}

        {formData.image ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-[#4a4540] dark:bg-[#2f2c29]">
            <div className="relative h-36 w-full overflow-hidden rounded-lg bg-white dark:bg-[#34322f]">
              <Image
                src={formData.image}
                alt="Pre-visualizacao do modelo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#4a4540] dark:text-blue-100 dark:hover:bg-[#2f2c29]"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {product ? 'Salvar Alteracoes' : 'Cadastrar Item'}
        </button>
      </div>
    </form>
  );
}
