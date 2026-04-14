'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { ProductForm } from '@/components/ProductForm';

export function ProductModal({
  isOpen,
  product,
  onClose,
  onSave,
  onFeedback,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(formData) {
    setIsSubmitting(true);
    setFieldErrors({});

    const response = await onSave(formData, product);

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
              <h3 className="text-lg font-bold text-slate-900">
                {product ? 'Editar Item' : 'Cadastrar Novo Item'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 transition-colors hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <ProductForm
                key={product?.id || 'new-product'}
                product={product}
                isSubmitting={isSubmitting}
                fieldErrors={fieldErrors}
                onCancel={onClose}
                onSubmit={handleSubmit}
                onFeedback={onFeedback}
              />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
