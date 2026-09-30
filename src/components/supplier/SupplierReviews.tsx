import React, { useState, useEffect, useMemo } from 'react';
import { SupplierLayout } from './SupplierLayout';
import { useSupplier } from '../../context/SupplierContext';
import { fetchSupplierReviews, ProductReview } from '../../lib/qaAndReviewsService';
import {
  Star,
  Search,
  ShieldCheck,
  Package,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const SupplierReviews: React.FC = () => {
  const { supplier } = useSupplier();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlFiltro = (searchParams.get('filtro') || searchParams.get('filter') || '').toLowerCase();
  const urlQ = searchParams.get('q') || searchParams.get('search') || '';

  const getInitialRatingFilter = (f: string): 'all' | '5' | '4' | '3' | 'verified' => {
    if (f === '5' || f === '5-estrellas') return '5';
    if (f === '4' || f === '4-estrellas') return '4';
    if (f === '3' || f === '3-estrellas') return '3';
    if (f === 'verificadas' || f === 'verified' || f === 'compras-verificadas') return 'verified';
    return 'all';
  };

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlQ);
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | 'verified'>(getInitialRatingFilter(urlFiltro));

  const syncUrlParams = (fVal: string, qVal: string) => {
    const params: Record<string, string> = {};
    if (fVal === '5') params.filtro = '5';
    else if (fVal === '4') params.filtro = '4';
    else if (fVal === '3') params.filtro = '3';
    else if (fVal === 'verified') params.filtro = 'verificadas';
    else params.filtro = 'todas';

    if (qVal.trim()) params.q = qVal.trim();
    setSearchParams(params, { replace: true });
  };

  const handleRatingFilterChange = (newFilter: 'all' | '5' | '4' | '3' | 'verified') => {
    setRatingFilter(newFilter);
    syncUrlParams(newFilter, search);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    syncUrlParams(ratingFilter, newSearch);
  };

  const loadReviews = async () => {
    if (!supplier) return;
    setLoading(true);
    try {
      const data = await fetchSupplierReviews(supplier.id);
      setReviews(data);
    } catch (err) {
      console.error('Error loading supplier reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [supplier]);

  // Overall statistics (defaults to 0.0 if no reviews exist)
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        avgRating: 0.0,
        totalReviews: 0,
        positivePercent: 0,
        verifiedCount: 0,
        counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
      };
    }

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    let verified = 0;

    reviews.forEach((r) => {
      sum += r.rating;
      const rounded = Math.max(1, Math.min(5, Math.round(r.rating)));
      counts[rounded] = (counts[rounded] || 0) + 1;
      if (r.verified_purchase || r.voucher_code) verified++;
    });

    const avg = Number((sum / reviews.length).toFixed(1));
    const positive = Math.round(((counts[5] + counts[4]) / reviews.length) * 100);

    return {
      avgRating: avg,
      totalReviews: reviews.length,
      positivePercent: positive,
      verifiedCount: verified,
      counts,
    };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      const matchSearch =
        !q ||
        r.user_name.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        (r.product_name && r.product_name.toLowerCase().includes(q)) ||
        (r.voucher_code && r.voucher_code.toLowerCase().includes(q));

      let matchFilter = true;
      if (ratingFilter === '5') matchFilter = Math.round(r.rating) === 5;
      else if (ratingFilter === '4') matchFilter = Math.round(r.rating) === 4;
      else if (ratingFilter === '3') matchFilter = Math.round(r.rating) <= 3;
      else if (ratingFilter === 'verified') matchFilter = Boolean(r.verified_purchase || r.voucher_code);

      return matchSearch && matchFilter;
    });
  }, [reviews, search, ratingFilter]);

  return (
    <SupplierLayout
      title="Calificaciones & Reseñas de Clientes"
      subtitle="Supervisa la reputación de tu tienda, opiniones de compradores y calificaciones de productos."
    >
      <div className="space-y-6">

        {/* LOADING SKELETON */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 h-64 rounded-3xl bg-white/[0.03] border border-white/[0.06] animate-pulse p-6" />
              <div className="lg:col-span-2 h-64 rounded-3xl bg-white/[0.03] border border-white/[0.06] animate-pulse p-6" />
            </div>
            <div className="h-12 w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse p-5" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* REPUTATION SUMMARY CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Overall Score Badge */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c1222] to-[#080d19] border border-white/[0.08] flex flex-col justify-between space-y-4 shadow-xl">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Reputación General
                  </span>
                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-5xl font-black text-white font-heading">
                      {stats.avgRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-400 font-mono">/ 5.0</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 mt-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${
                          s <= Math.round(stats.avgRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.06] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Total de Opiniones:</span>
                    <strong className="text-white font-mono">{stats.totalReviews}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Compras Verificadas:</span>
                    <strong className="text-emerald-400 font-mono">{stats.verifiedCount}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Calificaciones Positivas:</span>
                    <strong className="text-amber-400 font-mono">{stats.positivePercent}%</strong>
                  </div>
                </div>
              </div>

              {/* Star Distribution Breakdown */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0a0f1e] border border-white/[0.08] flex flex-col justify-between space-y-4 shadow-xl">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Desglose de Calificaciones de Compradores
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Valoraciones on-chain registradas directamente por compradores de tus productos.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = stats.counts[stars] || 0;
                    const percent = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;

                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 w-16 text-slate-300 shrink-0 font-mono">
                          <span>{stars}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </div>

                        {/* Progress Bar */}
                        <div className="flex-1 h-3 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              stars >= 4
                                ? 'bg-amber-400'
                                : stars === 3
                                ? 'bg-yellow-500'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="w-20 text-right text-slate-400 font-mono text-[11px] shrink-0">
                          <span className="text-white font-bold">{count}</span> ({percent}%)
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
                  <span>💡 Las valoraciones reflejan la calidad física del producto, el despacho y la garantía.</span>
                </div>
              </div>

            </div>

            {/* TOOLBAR: SEARCH & FILTERS */}
            <div className="p-4 rounded-2xl bg-[#0a0f1e]/80 border border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
              
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por comprador, producto o voucher..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {search && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => handleRatingFilterChange('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    ratingFilter === 'all'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-[#060911] text-slate-300 border border-white/[0.08] hover:border-amber-500/40'
                  }`}
                >
                  Todas ({reviews.length})
                </button>

                <button
                  onClick={() => handleRatingFilterChange('5')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                    ratingFilter === '5'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-[#060911] text-slate-300 border border-white/[0.08] hover:border-amber-500/40'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>5 Estrellas ({stats.counts[5] || 0})</span>
                </button>

                <button
                  onClick={() => handleRatingFilterChange('4')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                    ratingFilter === '4'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-[#060911] text-slate-300 border border-white/[0.08] hover:border-amber-500/40'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>4 Estrellas ({stats.counts[4] || 0})</span>
                </button>

                <button
                  onClick={() => handleRatingFilterChange('3')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                    ratingFilter === '3'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-[#060911] text-slate-300 border border-white/[0.08] hover:border-amber-500/40'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>3 Estrellas ({stats.counts[3] || 0})</span>
                </button>

                <button
                  onClick={() => handleRatingFilterChange('verified')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                    ratingFilter === 'verified'
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-[#060911] text-slate-300 border border-white/[0.08] hover:border-emerald-500/40'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Compra Verificada ({stats.verifiedCount})</span>
                </button>
              </div>

            </div>

            {/* REVIEWS LIST */}
            {filteredReviews.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#0a0f1e]/60 border border-white/[0.06] text-center space-y-3">
                <Star className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No se encontraron opiniones</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {search
                    ? 'No hay reseñas que coincidan con la búsqueda. Intenta con otro término.'
                    : 'Aún no se han registrado opiniones de compradores para tus productos.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredReviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl bg-[#090d19] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                  >
                    <div className="space-y-2.5">
                      {/* Top Header: Buyer & Rating */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                            {r.user_name ? r.user_name.substring(0, 2).toUpperCase() : 'CO'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{r.user_name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {r.created_at ? new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Reciente'}
                            </span>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Verified purchase pill */}
                      {(r.verified_purchase || r.voucher_code) && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Compra Verificada On-Chain {r.voucher_code ? `(Voucher #${r.voucher_code})` : ''}</span>
                        </div>
                      )}

                      {/* Comment */}
                      <p className="text-xs text-slate-200 leading-relaxed font-medium bg-black/20 p-3 rounded-xl border border-white/[0.04]">
                        "{r.comment}"
                      </p>
                    </div>

                    {/* Bottom: Product Reference Link */}
                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                        <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{r.product_name || 'Producto del catálogo'}</span>
                      </div>
                      <Link
                        to={`/producto/${r.product_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 font-semibold"
                        title="Ver producto en la tienda pública"
                      >
                        <span>Ver tienda</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </SupplierLayout>
  );
};
