'use client';

import { PieChart } from 'lucide-react';

const BRAND_COLORS = [
  '#2b5bb5',
  '#4f7dd6',
  '#79a0ef',
  '#90d4ff',
  '#7be0c5',
  '#f0c66b',
  '#e38a67',
  '#c978d6',
];

function buildChartSegments(brands) {
  if (!Array.isArray(brands) || brands.length === 0) {
    return 'linear-gradient(135deg, rgba(43,91,181,0.16), rgba(28,109,37,0.18))';
  }

  let currentStart = 0;

  const segments = brands.map((brand, index) => {
    const color = BRAND_COLORS[index % BRAND_COLORS.length];
    const start = currentStart;
    const end = currentStart + brand.percentage;
    currentStart = end;

    return `${color} ${start}% ${end}%`;
  });

  if (currentStart < 100) {
    segments.push(`#d7e6f4 ${currentStart}% 100%`);
  }

  return `conic-gradient(${segments.join(', ')})`;
}

export function SoldBrandsChart({ brandsSummary }) {
  const safeSummary =
    brandsSummary && typeof brandsSummary === 'object'
      ? {
          totalSold: Number(brandsSummary.totalSold || 0),
          breakdown: Array.isArray(brandsSummary.breakdown) ? brandsSummary.breakdown : [],
        }
      : {
          totalSold: 0,
          breakdown: [],
        };

  const hasSales = safeSummary.totalSold > 0 && safeSummary.breakdown.length > 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-[#45413c] dark:bg-[#2b2927] lg:col-span-5">
      <h3 className="mb-6 flex items-center gap-2 font-headline font-bold text-on-surface dark:text-blue-50">
        <PieChart className="text-primary" size={20} />
        Marcas Vendidas
      </h3>

      {hasSales ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
          <div className="mx-auto flex flex-col items-center">
            <div
              className="relative h-44 w-44 rounded-full border border-slate-100 shadow-inner dark:border-[#45413c]"
              style={{ backgroundImage: buildChartSegments(safeSummary.breakdown) }}
              aria-label="Gr\u00e1fico de porcentagem de vendas por marca"
              role="img"
            >
              <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm dark:border-[#45413c] dark:bg-[#242220]">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-blue-200/85">
                  Vendidas
                </span>
                <span className="mt-1 font-headline text-2xl font-extrabold text-slate-900 dark:text-blue-50">
                  {safeSummary.totalSold}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {safeSummary.breakdown.map((brand, index) => (
              <div
                key={brand.brand}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-[#45413c] dark:bg-[#242220]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: BRAND_COLORS[index % BRAND_COLORS.length] }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-blue-50">
                      {brand.brand}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-blue-200/80">
                      {brand.value} unidade(s) vendida(s)
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-sm font-extrabold text-primary dark:text-blue-200">
                  {brand.percentage}%
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-[#4b4741]">
          <p className="text-sm font-bold text-slate-700 dark:text-blue-100">
            Nenhuma venda registrada ainda.
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-blue-200/75">
            O gr\u00e1fico ser\u00e1 preenchido automaticamente quando unidades forem marcadas como
            vendidas.
          </p>
        </div>
      )}
    </div>
  );
}
