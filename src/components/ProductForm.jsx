'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/utils/produtoConstants';
import { resizeImage } from '@/utils/image';

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
    name: product.name || '',
    pn: product.pn || '',
    category: product.category || PRODUCT_CATEGORIES[0],
    price: product.price?.toString() || '',
    status: product.status || 'Ativo',
    image: product.image || '',
  };
}

const defaultFormData = {
  name: '',
  pn: '',
  category: PRODUCT_CATEGORIES[0],
  price: '',
  status: 'Ativo',
  image: '',
};

export function ProductForm({
  product,
  isSubmitting,
  fieldErrors = {},
  onCancel,
  onSubmit,
  onFeedback,
}) {
  const [formData, setFormData] = useState(() => buildInitialFormData(product));
  const [imageName, setImageName] = useState(() => (product?.image ? 'Imagem atual' : ''));

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

  function handleFormSubmit(event) {
    event.preventDefault();

    onSubmit({
      ...formData,
      price: Number.parseFloat(String(formData.price).replace(',', '.')),
      image: formData.image || null,
    });
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Nome do Produto
        </label>
        <input
          required
          type="text"
          value={formData.name}
          onChange={(event) => setFormData({ ...formData, name: event.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20"
          placeholder="Ex: Placa de Controle Central V3"
        />
        {fieldErrors.nome ? (
          <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.nome}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Modelo
          </label>
          <input
            required
            type="text"
            value={formData.pn}
            onChange={(event) => setFormData({ ...formData, pn: event.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20"
            placeholder="Ex: CTR-9902-LX"
          />
          {fieldErrors.pn ? (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.pn}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Valor (R$)
          </label>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={formData.price}
            onChange={(event) => setFormData({ ...formData, price: event.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20"
            placeholder="0.00"
          />
          {fieldErrors.preco ? (
            <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.preco}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Categoria
        </label>
        <select
          value={formData.category}
          onChange={(event) => setFormData({ ...formData, category: event.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20"
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
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Foto do Modelo (Opcional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageFileChange}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary"
        />

        {imageName ? (
          <p className="mt-2 text-xs font-medium text-slate-500">
            Imagem selecionada: {imageName}
          </p>
        ) : null}

        {formData.image ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
            <div className="relative h-36 w-full overflow-hidden rounded-lg bg-white">
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
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
