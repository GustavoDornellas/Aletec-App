'use client';
import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createUnit } from '@/lib/inventory-store';
const STATUS_AVAILABLE = `Dispon${String.fromCharCode(237)}vel pra venda`;
export default function UnitModal({ isOpen, onClose, productId, onError, onSuccess, onCreated }) {
    const [loading, setLoading] = useState(false);
    const [sn, setSn] = useState('');
    const [status, setStatus] = useState(STATUS_AVAILABLE);
    const [quantity, setQuantity] = useState(1);
    const [image, setImage] = useState('');
    const [imageName, setImageName] = useState('');
    const resizeImage = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Nao foi possivel ler a imagem.'));
                return;
            }
            const img = new window.Image();
            img.onload = () => {
                const maxSide = 480;
                const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                const context = canvas.getContext('2d');
                if (!context) {
                    reject(new Error('Nao foi possivel processar a imagem.'));
                    return;
                }
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressedImage = canvas.toDataURL('image/jpeg', 0.55);
                if (compressedImage.length > 180000) {
                    reject(new Error('A foto ainda ficou muito grande. Escolha uma imagem menor.'));
                    return;
                }
                resolve(compressedImage);
            };
            img.onerror = () => reject(new Error('Nao foi possivel abrir a imagem selecionada.'));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Nao foi possivel carregar a imagem selecionada.'));
        reader.readAsDataURL(file);
    });
    const handleImageFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        if (!file.type.startsWith('image/')) {
            onError?.('Selecione um arquivo de imagem valido.');
            event.target.value = '';
            return;
        }
        try {
            const resizedImage = await resizeImage(file);
            setImage(resizedImage);
            setImageName(file.name);
        }
        catch (error) {
            onError?.(error instanceof Error ? error.message : 'Nao foi possivel carregar a imagem selecionada.');
            setImage('');
            setImageName('');
            event.target.value = '';
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const createdUnit = await createUnit({
                productId,
                sn,
                status,
                quantity: parseInt(quantity.toString(), 10) || 1,
                image: image || null,
            });
            onCreated?.(createdUnit);
            setSn('');
            setImage('');
            setImageName('');
            setQuantity(1);
            setStatus(STATUS_AVAILABLE);
            onSuccess?.('Unidade adicionada com sucesso.');
            onClose();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Nao foi possivel cadastrar a unidade.';
            onError?.(message);
        }
        finally {
            setLoading(false);
        }
    };
    return (<AnimatePresence>
      {isOpen && (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-headline font-bold text-lg text-slate-900">Cadastrar Unidade (Lote)</h3>
              <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Numero de Serie</label>
                <input required type="text" value={sn} onChange={(e) => setSn(e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Ex: BN94-17213D"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status Inicial</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all">
                  <option>{STATUS_AVAILABLE}</option>
                  <option>Utilizada</option>
                  <option>Vendida</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantidade</label>
                <input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Foto da placa (OPCIONAL)</label>
                <input type="file" accept="image/*" onChange={handleImageFileChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary"/>
                {imageName && (<p className="mt-2 text-xs font-medium text-slate-500">Imagem selecionada: {imageName}</p>)}
                {image && (<div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <img src={image} alt="Pre-visualizacao da foto" className="h-32 w-full rounded-lg object-cover"/>
                  </div>)}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin"/>}
                  Cadastrar Unidade
                </button>
              </div>
            </form>
          </motion.div>
        </div>)}
    </AnimatePresence>);
}
