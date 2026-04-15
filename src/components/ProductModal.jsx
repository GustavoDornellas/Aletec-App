'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { ProductForm } from '@/components/ProductForm';

export function ProductModal({
  existingBrands = [],
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
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:border dark:border-[#45413c] dark:bg-[#34322f]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-[#45413c] dark:bg-[#2b2927]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-blue-50">
                {product ? 'Editar Item' : 'Cadastrar Novo Item'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-200 dark:text-blue-100 dark:hover:bg-[#34322f]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-white p-6 dark:bg-[#34322f]">
              <ProductForm
                key={product?.id || 'new-product'}
                existingBrands={existingBrands}
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
