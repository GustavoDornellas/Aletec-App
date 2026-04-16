'use client';

import { Banknote, BarChart3, Boxes, Package } from 'lucide-react';
import { motion } from 'motion/react';

export function DashboardView({ products, summary }) {
  const stats = [
    {
      label: 'Valor Vendido',
      value: `R$ ${summary.totalRevenue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })}`,
      sub: `${summary.soldUnits.toLocaleString('pt-BR')} unidades vendidas`,
      icon: Banknote,
    },
    {
      label: 'Em Estoque',
      value: summary.inStockUnits.toLocaleString('pt-BR'),
      sub: `${summary.totalUnits.toLocaleString('pt-BR')} unidades cadastradas`,
      icon: Package,
    },
    {
      label: 'Modelos Ativos',
      value: summary.totalProducts.toString(),
      sub: `${summary.categories.filter((category) => category.value > 0).length} categorias com estoque`,
      icon: BarChart3,
    },
    {
      label: 'Valor em Estoque',
      value: `R$ ${summary.inventoryValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })}`,
      sub: 'Baseado nas unidades em estoque',
      icon: Boxes,
    },
  ];

  const recentProducts = [...products]
    .sort((firstProduct, secondProduct) => {
      const firstTime = new Date(firstProduct.updatedAt || firstProduct.createdAt).getTime();
      const secondTime = new Date(secondProduct.updatedAt || secondProduct.createdAt).getTime();
      return secondTime - firstTime;
    })
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:space-y-8 md:p-8"
    >
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end [&_h2]:dark:text-blue-100 [&_p]:dark:text-blue-200/90">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-slate-900">
            Dashboard
          </h2>
          <p className="mt-1 text-sm font-medium uppercase tracking-wider text-on-surface-variant">
            Visao geral do estoque e da operacao
          </p>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:w-auto dark:border-[#45413c] dark:bg-[#2b2927]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-on-surface-variant dark:text-blue-200/85">
            Resumo rapido
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-blue-50">
            {summary.totalProducts} modelos cadastrados e{' '}
            {summary.inStockUnits.toLocaleString('pt-BR')} unidades em estoque
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:p-6 dark:border-[#45413c] dark:bg-[#2b2927]"
          >
            <div className="mb-4 flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant dark:text-blue-200/85">
                {stat.label}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon size={18} />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl dark:text-blue-50">
                {stat.value}
              </span>
              <span className="mt-2 text-[11px] font-bold text-tertiary md:text-xs dark:text-emerald-300">
                {stat.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-[#45413c] dark:bg-[#2b2927] lg:col-span-7">
          <h3 className="mb-6 flex items-center gap-2 font-headline font-bold text-on-surface dark:text-blue-50">
            <BarChart3 className="text-primary" size={20} />
            Distribuicao por Categoria
          </h3>

          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div className="space-y-4">
              {summary.categories.map((category) => {
                const percentage =
                  summary.totalProducts > 0
                    ? Math.round((category.value / summary.totalProducts) * 100)
                    : 0;

                return (
                  <div
                    key={category.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 dark:border-[#45413c] dark:bg-[#242220]"
                  >
                    <div className="mb-2 flex justify-between text-xs font-bold">
                      <span className="text-slate-900 dark:text-blue-50">{category.label}</span>
                      <span className="text-on-surface-variant dark:text-blue-200/85">
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-[#34322f]">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-2.5 rounded-full bg-primary"
                      />
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-on-surface-variant dark:text-blue-200/80">
                      {category.value} modelo(s)
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-[#45413c] dark:bg-[#242220]">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant dark:text-blue-200/85">
                    Status operacional
                  </p>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-blue-50">
                    {summary.inStockUnits > 0 ? 'Estoque ativo' : 'Sem estoque fisico'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-[#4b4741] dark:bg-[#2b2927]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant dark:text-blue-200/85">
                      Em estoque
                    </p>
                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-blue-50">
                      {summary.inStockUnits}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-[#4b4741] dark:bg-[#2b2927]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant dark:text-blue-200/85">
                      Vendidas
                    </p>
                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-blue-50">
                      {summary.soldUnits}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-[#45413c] dark:bg-[#2b2927] lg:col-span-5">
          <h3 className="mb-6 flex items-center gap-2 font-headline font-bold text-on-surface dark:text-blue-50">
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
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-blue-50">
                      {product.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-blue-200/80">
                      PN: {product.pn} | {product.category}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-blue-50">
                      {product.inStock || 0} estoque
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-blue-200/80">
                      {product.available || 0} anunc.
                    </p>
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
