'use client';

import React, { useEffect, useState } from 'react';
import { Banknote, Package, BarChart3, Loader2, Boxes } from 'lucide-react';
import { motion } from 'motion/react';
import { listProducts, Product, primeProductCache } from '@/lib/inventory-store';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        const nextProducts = await listProducts();
        if (!isMounted) return;
        setProducts(nextProducts);
        primeProductCache(nextProducts);
        setLoading(false);
      } catch {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    void setup();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalUnits = products.reduce((acc, p) => acc + (p.total || 0), 0);
  const availableUnits = products.reduce((acc, p) => acc + (p.available || 0), 0);
  const soldUnits = products.reduce((acc, p) => acc + (p.sold || 0), 0);
  const totalRevenue = products.reduce((acc, p) => acc + (p.sold || 0) * (p.price || 0), 0);
  const inventoryValue = products.reduce((acc, p) => acc + (p.available || 0) * (p.price || 0), 0);

  const categoryStats = [
    { label: 'Placa Principal', value: products.filter((p) => p.category === 'Placa Principal').length, color: 'bg-primary' },
    { label: 'Placa Fonte', value: products.filter((p) => p.category === 'Placa Fonte').length, color: 'bg-blue-400' },
    { label: 'Outros', value: products.filter((p) => p.category === 'Outros').length, color: 'bg-slate-400' },
  ];

  const stats = [
    {
      label: 'Valor Vendido',
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: `${soldUnits.toLocaleString('pt-BR')} unidades vendidas`,
      icon: Banknote,
    },
    {
      label: 'Em Estoque',
      value: availableUnits.toLocaleString('pt-BR'),
      sub: `${totalUnits.toLocaleString('pt-BR')} unidades cadastradas`,
      icon: Package,
    },
    {
      label: 'Modelos Ativos',
      value: products.length.toString(),
      sub: `${categoryStats.filter((category) => category.value > 0).length} categorias com estoque`,
      icon: BarChart3,
    },
    {
      label: 'Valor em Estoque',
      value: `R$ ${inventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: 'Baseado nas unidades disponíveis',
      icon: Boxes,
    },
  ];

  const recentProducts = [...products]
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-slate-500 text-sm font-medium">Carregando dados do sistema...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-6 md:space-y-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 md:p-6 shadow-sm border-l-4 border-primary/20 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{stat.label}</span>
              <stat.icon className="text-primary/60" size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-extrabold text-2xl md:text-3xl text-on-surface tracking-tight">{stat.value}</span>
              <span className="text-[10px] md:text-[11px] font-bold text-tertiary mt-1">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
            <BarChart3 className="text-primary" size={20} />
            Distribuição por Categoria
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {categoryStats.map((cat, i) => {
                const percentage = products.length > 0 ? Math.round((cat.value / products.length) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span>{cat.label}</span>
                      <span className="text-on-surface-variant">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`${cat.color} h-2 rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">Sistema Industrial</p>
                <p className="text-xs text-slate-500 font-medium">
                  Monitoramento ativo de {products.length} modelos e {availableUnits.toLocaleString('pt-BR')} unidades disponíveis
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
            <Package className="text-primary" size={20} />
            Resumo dos Produtos
          </h3>

          <div className="space-y-3">
            {recentProducts.length > 0 ? (
              recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      PN: {product.pn} • {product.category}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{product.available || 0} disp.</p>
                    <p className="text-[11px] text-slate-500">{product.sold || 0} vend.</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Nenhum produto cadastrado ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
