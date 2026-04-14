'use client';

import Image from 'next/image';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, X } from 'lucide-react';
import { resizeImage } from '@/utils/image';
import {
  UNIT_STATUS_AVAILABLE,
  UNIT_STATUS_OPTIONS,
} from '@/utils/produtoConstants';

export function UnitModal({ isOpen, productId, onClose, onSave, onFeedback }) {
  const [formData, setFormData] = useState({
    sn: '',
    status: UNIT_STATUS_AVAILABLE,
    quantity: 1,
    image: '',
  });
  const [imageName, setImageName] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        maxSide: 480,
        quality: 0.55,
        maxLength: 180000,
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

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    const response = await onSave({
      ...formData,
      productId,
      image: formData.image || null,
    });

    if (!response.success) {
      setFieldErrors(response.error.fields || {});
      onFeedback?.({
        type: 'error',
        message: response.error.message,
      });
      setIsSubmitting(false);
      return;
    }

    onFeedback?.({
      type: 'success',
      message: response.message,
    });
    setFormData({
      sn: '',
      status: UNIT_STATUS_AVAILABLE,
      quantity: 1,
      image: '',
    });
    setImageName('');
    setIsSubmitting(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Cadastrar Unidade</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 transition-colors hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Numero de Serie
                </label>
                <input
                  required
                  type="text"
                  value={formData.sn}
                  onChange={(event) => setFormData({ ...formData, sn: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: BN94-17213D"
                />
                {fieldErrors.sn ? (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.sn}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status Inicial
                </label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData({ ...formData, status: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20"
                >
                  {UNIT_STATUS_OPTIONS.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quantidade
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      quantity: Number.parseInt(event.target.value, 10) || 1,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20"
                />
                {fieldErrors.quantity ? (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.quantity}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Foto da placa (Opcional)
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
                    <div className="relative h-32 w-full overflow-hidden rounded-lg">
                      <Image
                        src={formData.image}
                        alt="Pre-visualizacao da foto"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
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
                  Cadastrar Unidade
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
