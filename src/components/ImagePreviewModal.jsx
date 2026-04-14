'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';

export function ImagePreviewModal({ image, onClose }) {
  return (
    <AnimatePresence>
      {image ? (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white"
            >
              Fechar
            </button>

            <div className="relative h-[80vh] overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
