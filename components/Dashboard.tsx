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
      sub: 'Baseado nas unidades disponiveis',
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 [&_h2]:dark:text-blue-100 [&_p]:dark:text-blue-200/90">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-on-surface-variant font-medium text-sm mt-1 uppercase tracking-wider">
            Visao geral do estoque e da operacao
          </p>
        </div>
        <div className="w-full md:w-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-[#45413c] dark:bg-[#2b2927]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-on-surface-variant dark:text-blue-200/85">Resumo rapido</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-blue-50">
            {products.length} modelos cadastrados e {availableUnits.toLocaleString('pt-BR')} unidades disponiveis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow dark:bg-[#2b2927] dark:border-[#45413c]"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] dark:text-blue-200/85">{stat.label}</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon size={18} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-extrabold text-2xl md:text-3xl text-on-surface tracking-tight dark:text-blue-50">{stat.value}</span>
              <span className="text-[11px] md:text-xs font-bold text-tertiary mt-2 dark:text-emerald-300">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-[#2b2927] dark:border-[#45413c]">
          <h3 className="font-headline font-bold text-on-surface mb-6 flex items-center gap-2 dark:text-blue-50">
            <BarChart3 className="text-primary" size={20} />
            Distribuicao por Categoria
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              {categoryStats.map((cat, i) => {
                const percentage = products.length > 0 ? Math.round((cat.value / products.length) * 100) : 0;
                return (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 dark:border-[#45413c] dark:bg-[#242220]">
                    <div className="flex justify-between text-xs mb-2 font-bold">
                      <span className="text-slate-900 dark:text-blue-50">{cat.label}</span>
                      <span className="text-on-surface-variant dark:text-blue-200/85">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 dark:bg-[#34322f]">
                      <div style={{ width: `${percentage}%` }} className={`${cat.color} h-2.5 rounded-full`} />
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-on-surface-variant dark:text-blue-200/80">{cat.value} modelo(s)</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 dark:bg-[#242220] dark:border-[#45413c]">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-2 dark:text-blue-200/85">Status operacional</p>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-blue-50">
                    {availableUnits > 0 ? 'Estoque ativo' : 'Sem disponibilidade'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white px-4 py-3 border border-slate-200 dark:bg-[#2b2927] dark:border-[#4b4741]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant dark:text-blue-200/85">Disponiveis</p>
                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-blue-50">{availableUnits}</p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 border border-slate-200 dark:bg-[#2b2927] dark:border-[#4b4741]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant dark:text-blue-200/85">Vendidas</p>
                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-blue-50">{soldUnits}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-[#2b2927] dark:border-[#45413c]">
          <h3 className="font-headline font-bold text-on-surface mb-6 flex items-center gap-2 dark:text-blue-50">
            <Package className="text-primary" size={20} />
            Resumo dos Produtos
          </h3>

          <div className="space-y-3">
            {recentProducts.length > 0 ? (
              recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-[#45413c] dark:bg-[#242220]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate dark:text-blue-50">{product.name}</p>
                    <p className="text-[11px] text-slate-500 truncate dark:text-blue-200/80">
                      PN: {product.pn} • {product.category}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-blue-50">{product.available || 0} disp.</p>
                    <p className="text-[11px] text-slate-500 dark:text-blue-200/80">{product.sold || 0} vend.</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-[#4b4741] dark:text-blue-300/70">
                Nenhum produto cadastrado ainda.
              </div>
            )}
          </div>
        </div>
      </div>

    </motion.div>
  );
}
