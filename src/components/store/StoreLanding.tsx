import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Product, Order } from '../../types/store';
import { useCart } from '../../context/CartContext';
import { CartDrawer } from '../shared/CartDrawer';
import { VoucherModal } from '../shared/VoucherModal';
import { Blobatar } from '../ui/blobatar';
import { parseBlobatar } from '../../lib/blobatarHelper';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Bitcoin,
  Search,
  Receipt,
  ChevronRight,
  AlertCircle,
  Package,
  Truck,
  Zap,
  Tag,
  Star,
  RotateCcw,
  SlidersHorizontal,
  Filter,
  ShieldCheck,
  X
} from 'lucide-react';

import { fetchAllStoreProducts, BTC_PRICE_USD, isFreeShippingProduct } from '../../data/productsData';

export const StoreLanding: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlFiltro = (searchParams.get('filtro') || searchParams.get('filter') || '').toLowerCase();
  const urlQ = searchParams.get('q') || searchParams.get('search') || '';
  const urlCategoria = searchParams.get('categoria') || searchParams.get('category') || 'Todas';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Active filter modes (removed 'active' completely per user request)
  const [searchQuery, setSearchQuery] = useState(urlQ);
  const [selectedCategory, setSelectedCategory] = useState(urlCategoria);
  const [activeCatalogFilter, setActiveCatalogFilter] = useState<'all' | 'stock' | 'discount' | 'free_shipping' | 'express'>(() => {
    if (urlFiltro === 'stock' || urlFiltro === 'disponibles') return 'stock';
    if (urlFiltro === 'ofertas' || urlFiltro === 'descuentos' || urlFiltro === 'discount') return 'discount';
    if (urlFiltro === 'envio-gratis' || urlFiltro === 'gratis' || urlFiltro === 'free' || urlFiltro === 'free_shipping') return 'free_shipping';
    if (urlFiltro === 'express') return 'express';
    return 'all';
  });

  const [priceRange, setPriceRange] = useState<'all' | 'under-50' | '50-150' | '150-500' | 'over-500'>('all');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'new' | 'refurbished'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyOfficialWarranty, setOnlyOfficialWarranty] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'discount' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Sync URL search params
  const syncStoreUrlParams = (
    qStr: string,
    catStr: string,
    filterMode: string,
    price?: string
  ) => {
    const params: Record<string, string> = {};
    if (filterMode === 'stock') params.filtro = 'stock';
    else if (filterMode === 'discount') params.filtro = 'ofertas';
    else if (filterMode === 'free_shipping') params.filtro = 'envio-gratis';
    else if (filterMode === 'express') params.filtro = 'express';

    if (qStr.trim()) params.q = qStr.trim();
    if (catStr && catStr !== 'Todas') params.categoria = catStr;
    if (price && price !== 'all') params.precio = price;

    setSearchParams(params, { replace: true });
  };

  // Listen to browser navigation / URL updates
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || '';
    const filtroParam = (searchParams.get('filtro') || searchParams.get('filter') || '').toLowerCase();
    const catParam = searchParams.get('categoria') || searchParams.get('category') || 'Todas';

    if (qParam !== searchQuery) setSearchQuery(qParam);
    if (catParam !== selectedCategory) setSelectedCategory(catParam);

    if (filtroParam === 'stock' || filtroParam === 'disponibles') {
      setActiveCatalogFilter('stock');
    } else if (filtroParam === 'ofertas' || filtroParam === 'descuentos') {
      setActiveCatalogFilter('discount');
    } else if (filtroParam === 'envio-gratis' || filtroParam === 'gratis') {
      setActiveCatalogFilter('free_shipping');
    } else if (filtroParam === 'express') {
      setActiveCatalogFilter('express');
    } else if (filtroParam === 'todos' || filtroParam === 'all' || filtroParam === 'activos' || filtroParam === 'active') {
      setActiveCatalogFilter('all');
    }
  }, [searchParams]);

  // Auto-scroll to catalog if URL contains query or filter
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || '';
    const fParam = searchParams.get('filtro') || searchParams.get('filter') || '';
    const cParam = searchParams.get('categoria') || searchParams.get('category') || '';

    if (!loading && (qParam.trim() || fParam.trim() || (cParam && cParam !== 'Todas'))) {
      const timer = setTimeout(() => {
        const el = document.getElementById('catalogo');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, searchParams]);

  // Voucher lookup
  const [lookupVoucherCode, setLookupVoucherCode] = useState('');
  const [lookupResult, setLookupResult] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);

  const { addToCart, itemCount, setIsCartOpen } = useCart();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchAllStoreProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching real products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    return ['Todas', ...Array.from(new Set(products.map((p) => p.category || 'General')))];
  }, [products]);

  // Category item counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { Todas: products.length };
    products.forEach((p) => {
      const cat = p.category || 'General';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [products]);

  // Specific filter counts
  const stockCount = useMemo(() => products.filter((p) => p.stock > 0).length, [products]);
  const discountCount = useMemo(() => products.filter((p) => (p.discount_percent || 0) > 0).length, [products]);
  const freeShippingCount = useMemo(() => products.filter(isFreeShippingProduct).length, [products]);
  const expressCount = useMemo(() => products.filter((p) => p.shipping_type === 'express').length, [products]);

  // Comprehensive multi-filter engine
  const filteredProducts = useMemo(() => {
    const cleanQ = searchQuery
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    return products
      .filter((p) => {
        // Search query matching
        const normName = (p.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const normDesc = (p.description || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const normSku = (p.sku || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const normCat = (p.category || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const normSupplier = (p.suppliers?.company_name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        const matchesSearch =
          !cleanQ ||
          normName.includes(cleanQ) ||
          normDesc.includes(cleanQ) ||
          normSku.includes(cleanQ) ||
          normCat.includes(cleanQ) ||
          normSupplier.includes(cleanQ);
        
        // Category
        const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;

        // Catalog Filter Mode (stock, discount, free_shipping, express)
        let matchesFilterMode = true;
        if (activeCatalogFilter === 'stock') {
          matchesFilterMode = p.stock > 0;
        } else if (activeCatalogFilter === 'discount') {
          matchesFilterMode = Boolean(p.discount_percent && p.discount_percent > 0);
        } else if (activeCatalogFilter === 'free_shipping') {
          matchesFilterMode = isFreeShippingProduct(p);
        } else if (activeCatalogFilter === 'express') {
          matchesFilterMode = p.shipping_type === 'express';
        }

        // Price range
        let matchesPrice = true;
        if (priceRange === 'under-50') matchesPrice = p.price_usd < 50;
        else if (priceRange === '50-150') matchesPrice = p.price_usd >= 50 && p.price_usd <= 150;
        else if (priceRange === '150-500') matchesPrice = p.price_usd > 150 && p.price_usd <= 500;
        else if (priceRange === 'over-500') matchesPrice = p.price_usd > 500;

        // Condition
        let matchesCondition = true;
        if (conditionFilter === 'new') {
          matchesCondition = !p.condition || p.condition.toLowerCase().includes('nuevo') || p.condition.toLowerCase().includes('new');
        } else if (conditionFilter === 'refurbished') {
          matchesCondition = Boolean(p.condition && (p.condition.toLowerCase().includes('reacon') || p.condition.toLowerCase().includes('refurb')));
        }

        // Rating
        let matchesRating = true;
        if (minRating > 0) {
          matchesRating = (p.rating || 0) >= minRating;
        }

        // Official Warranty
        let matchesWarranty = true;
        if (onlyOfficialWarranty) {
          matchesWarranty = Boolean(p.warranty && p.warranty.trim().length > 0 && !p.warranty.toLowerCase().includes('sin'));
        }

        return matchesSearch && matchesCategory && matchesFilterMode && matchesPrice && matchesCondition && matchesRating && matchesWarranty;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price_usd - b.price_usd;
        if (sortBy === 'price-desc') return b.price_usd - a.price_usd;
        if (sortBy === 'discount') return (b.discount_percent || 0) - (a.discount_percent || 0);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'newest') return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        return 0; // featured default
      });
  }, [products, searchQuery, selectedCategory, activeCatalogFilter, priceRange, conditionFilter, minRating, onlyOfficialWarranty, sortBy]);

  const activeFiltersCount =
    (selectedCategory !== 'Todas' ? 1 : 0) +
    (activeCatalogFilter !== 'all' ? 1 : 0) +
    (priceRange !== 'all' ? 1 : 0) +
    (conditionFilter !== 'all' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (onlyOfficialWarranty ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todas');
    setActiveCatalogFilter('all');
    setPriceRange('all');
    setConditionFilter('all');
    setMinRating(0);
    setOnlyOfficialWarranty(false);
    setSortBy('featured');
    setSearchParams({}, { replace: true });
  };

  const handleSearchChange = (newQ: string) => {
    setSearchQuery(newQ);
    syncStoreUrlParams(newQ, selectedCategory, activeCatalogFilter, priceRange);
  };

  const handleCategorySelect = (newCat: string) => {
    setSelectedCategory(newCat);
    syncStoreUrlParams(searchQuery, newCat, activeCatalogFilter, priceRange);
  };

  const handleCatalogFilterSelect = (mode: 'all' | 'stock' | 'discount' | 'free_shipping' | 'express') => {
    setActiveCatalogFilter(mode);
    syncStoreUrlParams(searchQuery, selectedCategory, mode, priceRange);
  };

  const handleLookupVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupVoucherCode.trim()) return;

    setIsLookingUp(true);
    setLookupError('');
    try {
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .or(`voucher_code.eq.${lookupVoucherCode.trim()},order_number.eq.${lookupVoucherCode.trim()}`)
        .single();

      if (orderErr || !orderData) {
        setLookupError('No se encontró ningún voucher con ese código o número de orden.');
        setIsLookingUp(false);
        return;
      }

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      const fullOrder: Order = {
        ...orderData,
        items: itemsData || [],
      };

      setLookupResult(fullOrder);
      setShowLookupModal(true);
    } catch (err: any) {
      console.error('Error looking up voucher:', err);
      setLookupError('Ocurrió un error al buscar el comprobante.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const renderSidebarContent = () => (
    <div className="space-y-6">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase font-mono tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span>Filtros</span>
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={resetAllFilters}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar ({activeFiltersCount})</span>
          </button>
        )}
      </div>

      {/* Disponibilidad & Envíos */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          Disponibilidad & Ofertas
        </span>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => handleCatalogFilterSelect('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeCatalogFilter === 'all'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-300 hover:bg-white/[0.05]'
            }`}
          >
            <span>Todos los Productos</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeCatalogFilter === 'all' ? 'bg-black/20 text-black font-bold' : 'bg-white/[0.06] text-slate-400'
            }`}>
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleCatalogFilterSelect('stock')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeCatalogFilter === 'stock'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-bold'
                : 'text-slate-300 hover:bg-white/[0.05]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span>En Stock</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeCatalogFilter === 'stock' ? 'bg-black/20 text-black font-bold' : 'bg-white/[0.06] text-slate-400'
            }`}>
              {stockCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleCatalogFilterSelect('discount')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeCatalogFilter === 'discount'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-bold'
                : 'text-slate-300 hover:bg-white/[0.05]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-rose-400" />
              <span>En Descuento</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeCatalogFilter === 'discount' ? 'bg-black/20 text-white font-bold' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {discountCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleCatalogFilterSelect('free_shipping')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeCatalogFilter === 'free_shipping'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-300 hover:bg-white/[0.05]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Envío Gratis</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeCatalogFilter === 'free_shipping' ? 'bg-black/20 text-black font-bold' : 'bg-white/[0.06] text-slate-400'
            }`}>
              {freeShippingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleCatalogFilterSelect('express')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeCatalogFilter === 'express'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-300 hover:bg-white/[0.05]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Express 24h</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeCatalogFilter === 'express' ? 'bg-black/20 text-black font-bold' : 'bg-white/[0.06] text-slate-400'
            }`}>
              {expressCount}
            </span>
          </button>
        </div>
      </div>

      {/* Categorías */}
      <div className="space-y-2 pt-4 border-t border-white/[0.06]">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          Categorías
        </span>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <span className="truncate">{cat}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat ? 'bg-amber-500/30 text-amber-200' : 'text-slate-500'
              }`}>
                {categoryCounts[cat] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Rango de Precios */}
      <div className="space-y-2 pt-4 border-t border-white/[0.06]">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          Rango de Precio
        </span>
        <div className="space-y-1">
          {[
            { id: 'all', label: 'Cualquier Precio' },
            { id: 'under-50', label: 'Menos de $50 USD' },
            { id: '50-150', label: '$50 a $150 USD' },
            { id: '150-500', label: '$150 a $500 USD' },
            { id: 'over-500', label: 'Más de $500 USD' }
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPriceRange(p.id as any);
                syncStoreUrlParams(searchQuery, selectedCategory, activeCatalogFilter, p.id);
              }}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                priceRange === p.id
                  ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Condición */}
      <div className="space-y-2 pt-4 border-t border-white/[0.06]">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          Condición
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setConditionFilter('all')}
            className={`px-2.5 py-1.5 rounded-xl text-center transition ${
              conditionFilter === 'all'
                ? 'bg-white/[0.12] text-white border border-white/[0.2]'
                : 'text-slate-400 hover:bg-white/[0.04]'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setConditionFilter('new')}
            className={`px-2.5 py-1.5 rounded-xl text-center transition ${
              conditionFilter === 'new'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:bg-white/[0.04]'
            }`}
          >
            Nuevo
          </button>
          <button
            type="button"
            onClick={() => setConditionFilter('refurbished')}
            className={`col-span-2 px-2.5 py-1.5 rounded-xl text-center transition ${
              conditionFilter === 'refurbished'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:bg-white/[0.04]'
            }`}
          >
            Reacondicionado
          </button>
        </div>
      </div>

      {/* Calificación Mínima */}
      <div className="space-y-2 pt-4 border-t border-white/[0.06]">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          Calificación Mínima
        </span>
        <div className="space-y-1">
          {[
            { val: 0, label: 'Cualquier Calificación' },
            { val: 4.5, label: '4.5+ Estrellas' },
            { val: 4.0, label: '4.0+ Estrellas' },
            { val: 3.0, label: '3.0+ Estrellas' }
          ].map((r) => (
            <button
              key={r.val}
              type="button"
              onClick={() => setMinRating(r.val)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                minRating === r.val
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <span>{r.label}</span>
              {r.val > 0 && (
                <div className="flex items-center text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Garantía */}
      <div className="space-y-2 pt-4 border-t border-white/[0.06]">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium select-none hover:text-white">
          <input
            type="checkbox"
            checked={onlyOfficialWarranty}
            onChange={(e) => setOnlyOfficialWarranty(e.target.checked)}
            className="rounded accent-amber-500"
          />
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Con Garantía Oficial</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      
      {/* MINIMALIST TOP BAR */}
      <div className="bg-[#04060c] border-b border-white/[0.06] text-[11px] font-mono text-slate-400 py-2 px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Red Bitcoin: Bloque Verificado</span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">1 BTC = ${BTC_PRICE_USD.toLocaleString()} USD</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-slate-400">Smart Contract: NovaSats.sol v2.0</span>
          <a
            href="#consultar-voucher"
            className="text-slate-300 hover:text-amber-400 transition flex items-center gap-1"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>Consultar Voucher</span>
          </a>
        </div>
      </div>

      {/* MAIN NAVBAR (Clean & Minimalist: No Wallet button, no Navbar cart button) */}
      <header className="sticky top-0 z-40 bg-[#060911]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <Bitcoin className="w-6 h-6 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1 font-heading">
                Nova<span className="text-amber-500">Sats</span>
              </span>
              <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-widest block -mt-1 font-mono">
                Store Marketplace
              </span>
            </div>
          </Link>
        </div>

        {/* Minimal Right Header Info */}
        <div className="flex items-center gap-4">
          <a
            href="#catalogo"
            className="text-xs font-semibold text-slate-300 hover:text-amber-400 transition flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Catálogo Completo ({products.length})</span>
          </a>
        </div>
      </header>

      {/* MINIMALIST EDITORIAL HERO */}
      <section className="relative pt-16 pb-20 px-4 sm:px-8 lg:px-12 border-b border-white/[0.08] bg-[#060911] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-amber-400 text-xs font-mono font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Ecosistema de Comercio Descentralizado On-Chain
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-heading leading-[1.1]">
            Comercio global con liquidación instantánea en <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">Bitcoin</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            Adquiere productos directamente de proveedores verificados. Sin intermediarios bancarios, con firma de contrato inteligente <code className="text-amber-400 font-mono text-xs">NovaSats.sol</code> y voucher digital inmutable con respaldo PDF y Gmail.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#catalogo"
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/15 transition flex items-center gap-2"
            >
              <span>Explorar Catálogo</span>
              <ChevronRight className="w-4 h-4" />
            </a>
            <a
              href="#consultar-voucher"
              className="px-6 py-3.5 bg-[#0e1424] hover:bg-[#161f38] border border-white/[0.08] hover:border-amber-500/30 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-2"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Consultar Voucher</span>
            </a>
          </div>

          {/* Minimalist 3-Pillar Proofs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 text-left">
            <div className="p-5 rounded-2xl bg-[#0a0f1e]/80 border border-white/[0.06]">
              <div className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                01 • Transparencia Total
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Pagos Directos P2P</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                El valor es transferido de tu billetera al proveedor sin comisiones ocultas ni retenciones fiduciarias.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0a0f1e]/80 border border-white/[0.06]">
              <div className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                02 • Smart Contract NovaSats
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Firma Criptográfica ECDSA</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada orden genera un hash verificable en blockchain respaldado por el contrato 'Verificado On-Chain'.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0a0f1e]/80 border border-white/[0.06]">
              <div className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                03 • Garantía & Vouchers
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Comprobante Inmutable</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Descarga tu comprobante oficial en PDF de alta fidelidad o envíatelo directamente a tu correo Gmail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RICH & VARIED PRODUCT CATALOG SECTION WITH LATERAL FILTER NAVIGATION */}
      <section id="catalogo" className="py-14 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full flex-1">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
              Mercado Descentralizado
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading mt-0.5">
              Catálogo de Productos
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Explora {products.length} productos verificados de tecnología, hardware wallets, minería y moda crypto.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, categoría o proveedor..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[#0a0f1e] border border-white/[0.1] rounded-xl pl-10 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Layout: Lateral Sidebar + Main Product Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LATERAL NAVIGATION FILTER SIDEBAR (DESKTOP) */}
          <aside className="hidden lg:block w-72 shrink-0 bg-[#090d19]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-5 sticky top-28 shadow-xl">
            {renderSidebarContent()}
          </aside>

          {/* MOBILE FILTER DRAWER */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in">
              <div className="w-full max-w-xs bg-[#090d19] h-full p-6 overflow-y-auto space-y-6 border-r border-white/[0.1] shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Filter className="w-4 h-4 text-amber-400" />
                      <span>Filtros del Catálogo</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMobileFilters(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="pt-4 space-y-6">
                    {renderSidebarContent()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg mt-6"
                >
                  Ver {filteredProducts.length} Productos
                </button>
              </div>
              <div className="flex-1" onClick={() => setShowMobileFilters(false)} />
            </div>
          )}

          {/* MAIN PRODUCT AREA */}
          <div className="flex-1 min-w-0 space-y-4">
            
            {/* Top Toolbar (Mobile filter button, Results count, Sort) */}
            <div className="p-3.5 rounded-2xl bg-[#0a0f1e]/80 border border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden px-3 py-1.5 bg-[#121829] border border-white/[0.1] rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 hover:border-amber-500/50 transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <span className="text-xs font-mono text-slate-400">
                  Mostrando <strong className="text-white">{filteredProducts.length}</strong> de {products.length} productos
                </span>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] text-slate-400 font-mono">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="featured">Destacados</option>
                  <option value="discount">Mayor Descuento</option>
                  <option value="price-asc">Menor Precio</option>
                  <option value="price-desc">Mayor Precio</option>
                  <option value="rating">Mejor Calificados</option>
                  <option value="newest">Más Nuevos</option>
                </select>
              </div>
            </div>

            {/* Active Filters Chips Bar */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 py-1">
                <span className="text-[11px] text-slate-500 font-mono">Filtros activos:</span>
                
                {searchQuery && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1">
                    "{searchQuery}"
                    <button type="button" onClick={() => handleSearchChange('')} className="hover:text-white">✕</button>
                  </span>
                )}

                {selectedCategory !== 'Todas' && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1">
                    {selectedCategory}
                    <button type="button" onClick={() => handleCategorySelect('Todas')} className="hover:text-white">✕</button>
                  </span>
                )}

                {activeCatalogFilter !== 'all' && (
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1">
                    {activeCatalogFilter === 'stock' && 'En Stock'}
                    {activeCatalogFilter === 'discount' && 'En Descuento'}
                    {activeCatalogFilter === 'free_shipping' && 'Envío Gratis'}
                    {activeCatalogFilter === 'express' && 'Express'}
                    <button type="button" onClick={() => handleCatalogFilterSelect('all')} className="hover:text-white">✕</button>
                  </span>
                )}

                {priceRange !== 'all' && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.08] border border-white/[0.15] text-slate-200 text-xs font-medium flex items-center gap-1">
                    {priceRange === 'under-50' && '< $50 USD'}
                    {priceRange === '50-150' && '$50 - $150 USD'}
                    {priceRange === '150-500' && '$150 - $500 USD'}
                    {priceRange === 'over-500' && '> $500 USD'}
                    <button type="button" onClick={() => { setPriceRange('all'); syncStoreUrlParams(searchQuery, selectedCategory, activeCatalogFilter, 'all'); }} className="hover:text-white">✕</button>
                  </span>
                )}

                {conditionFilter !== 'all' && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1">
                    {conditionFilter === 'new' ? 'Nuevo' : 'Reacondicionado'}
                    <button type="button" onClick={() => setConditionFilter('all')} className="hover:text-white">✕</button>
                  </span>
                )}

                {minRating > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1">
                    ★ {minRating}+
                    <button type="button" onClick={() => setMinRating(0)} className="hover:text-white">✕</button>
                  </span>
                )}

                {onlyOfficialWarranty && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center gap-1">
                    Con Garantía
                    <button type="button" onClick={() => setOnlyOfficialWarranty(false)} className="hover:text-white">✕</button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold ml-1"
                >
                  Limpiar todo
                </button>
              </div>
            )}

        {/* PRODUCTS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-[#0a0f1e] border border-white/[0.06] animate-pulse p-4 space-y-4">
                <div className="w-full h-48 bg-white/[0.04] rounded-xl" />
                <div className="h-4 bg-white/[0.04] rounded w-3/4" />
                <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                <div className="h-8 bg-white/[0.04] rounded-xl mt-6" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#0a0f1e]/50 border border-white/[0.06] rounded-3xl p-8 max-w-lg mx-auto space-y-3">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No hay productos con los filtros seleccionados</h3>
            <p className="text-xs text-slate-400">
              Prueba cambiando o limpiando los filtros para ver más opciones en el catálogo.
            </p>
            <button
              onClick={resetAllFilters}
              className="mt-2 px-4 py-2 bg-amber-500 text-black text-xs font-black rounded-xl hover:bg-amber-400 transition"
            >
              Restablecer Todos los Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const inStock = product.stock > 0;
              const supplierName = product.suppliers?.company_name || 'Proveedor Verificado';

              return (
                <div
                  key={product.id}
                  className="group bg-[#090d19] border border-white/[0.08] hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1 relative block"
                >
                  <div>
                    {/* Image Area with badges */}
                    <Link
                      to={`/producto/${product.id}`}
                      className="block"
                      draggable="true"
                      onDragStart={(e) => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : '';
                        const fullUrl = `${origin}/producto/${product.id}`;
                        e.dataTransfer.clearData();
                        e.dataTransfer.setData('text/plain', product.name);
                        e.dataTransfer.setData('text/uri-list', fullUrl);
                      }}
                    >
                    <div className="w-full h-48 rounded-xl overflow-hidden bg-black/40 relative mb-3.5">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=800'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                        loading="lazy"
                      />
                      
                      {/* Top Left: Discount badge */}
                      {product.discount_percent && product.discount_percent > 0 && (
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md shadow-rose-900/50 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            -{product.discount_percent}% OFF
                          </span>
                        </div>
                      )}

                      {/* Top Right: Stock Pill Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md ${
                            inStock
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {inStock ? `${product.stock} disp.` : 'Agotado'}
                        </span>
                      </div>

                      {/* Bottom Badges: Free Shipping & Category */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
                        {product.category && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-black/80 text-slate-300 border border-white/[0.1] backdrop-blur-md">
                            {product.category}
                          </span>
                        )}

                        {isFreeShippingProduct(product) && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                            <Truck className="w-2.5 h-2.5" />
                            Envío Gratis
                          </span>
                        )}

                        {product.shipping_type === 'express' && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            Express 24h
                          </span>
                        )}
                      </div>
                    </div>

                    </Link>

                    {/* Supplier Info with Blobatar */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {(() => {
                          const parsed = parseBlobatar(product.suppliers?.avatar_url, supplierName);
                          return (
                            <Blobatar
                              name={parsed.seed}
                              blobatar={{
                                expression: parsed.expression,
                                animate: 'hover',
                              }}
                              className={`w-5 h-5 ${parsed.shapeClass} border border-white/[0.1] shrink-0`}
                            />
                          );
                        })()}
                        <span className="text-[11px] font-semibold text-slate-400 truncate">
                          {supplierName}
                        </span>
                      </div>

                      {/* Rating */}
                      {product.rating !== undefined && product.rating !== null && product.rating > 0 ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 shrink-0">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{product.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 shrink-0" title="Sin opiniones de compradores aún">
                          <Star className="w-3 h-3 text-slate-600" />
                          <span>0.0</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <Link
                      to={`/producto/${product.id}`}
                      draggable="true"
                      onDragStart={(e) => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : '';
                        const fullUrl = `${origin}/producto/${product.id}`;
                        e.dataTransfer.clearData();
                        e.dataTransfer.setData('text/plain', product.name);
                        e.dataTransfer.setData('text/uri-list', fullUrl);
                      }}
                      className="text-sm font-bold text-white hover:text-amber-400 transition leading-snug line-clamp-2 block hover:underline"
                    >
                      {product.name}
                    </Link>

                    {/* Description preview */}
                    {product.description && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-end justify-between gap-2">
                    <div>
                      {/* Original crossed-out price if discounted */}
                      {product.original_price_usd && product.original_price_usd > product.price_usd && (
                        <span className="text-[11px] text-slate-500 line-through font-mono block">
                          ${product.original_price_usd.toFixed(2)} USD
                        </span>
                      )}

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-amber-400 font-mono">
                          {product.price_btc.toFixed(6)} BTC
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        ≈ ${product.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      disabled={!inStock}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-30 disabled:pointer-events-none active:scale-95 flex items-center gap-1.5 shrink-0"
                      title={inStock ? 'Añadir a la bolsa' : 'Producto agotado'}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{inStock ? 'Comprar' : 'Agotado'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

          </div>
        </div>

      </section>

      {/* VOUCHER LOOKUP SECTION */}
      <section id="consultar-voucher" className="border-t border-white/[0.08] bg-[#05070e] py-16 px-4 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Receipt className="w-6 h-6" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
            Consultar Comprobante de Compra
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Ingresa tu código de voucher o número de orden para revisar los detalles del pedido, descargar el PDF o reenviarlo a tu correo Gmail.
          </p>

          <form onSubmit={handleLookupVoucher} className="pt-2 max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Ej: VCH-2026-XXXX ó ORD-..."
                value={lookupVoucherCode}
                onChange={(e) => setLookupVoucherCode(e.target.value)}
                className="flex-1 bg-[#0a0f1e] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isLookingUp}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isLookingUp ? 'Buscando...' : 'Consultar'}
              </button>
            </div>
            {lookupError && (
              <p className="text-xs text-red-400 mt-2 text-left flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{lookupError}</span>
              </p>
            )}
          </form>
        </div>
      </section>

      {/* MINIMALIST STORE FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#04060c] pt-14 pb-8 px-4 sm:px-8 lg:px-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <span className="text-lg font-black tracking-tight text-white font-heading">
                Nova<span className="text-amber-500">Sats</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Plataforma de comercio electrónico descentralizado respaldada en la red Bitcoin con firmas de contrato inteligente `NovaSats.sol`.
            </p>
            <div className="pt-1">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                100% Non-Custodial P2P
              </span>
            </div>
          </div>

          {/* Col 1: Nosotros */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Nosotros
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/trabaja-con-nosotros" className="hover:text-amber-400 transition block">
                  Trabaja con nosotros
                </Link>
              </li>
              <li>
                <Link to="/sobre-nosotros" className="hover:text-amber-400 transition block">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link to="/nuestro-proposito" className="hover:text-amber-400 transition block">
                  Nuestro propósito
                </Link>
              </li>
              <li>
                <Link to="/promociones" className="hover:text-amber-400 transition block">
                  Promociones
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Servicio al cliente & Ayuda */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Servicio al cliente & Ayuda
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/ayuda" className="hover:text-amber-400 transition block">
                  Ayuda
                </Link>
              </li>
              <li>
                <Link to="/servicio-al-cliente" className="hover:text-amber-400 transition block">
                  Servicio al cliente
                </Link>
              </li>
              <li>
                <Link to="/reclamos" className="hover:text-amber-400 transition block">
                  Reclamos
                </Link>
              </li>
              <li>
                <Link to="/libro-de-reclamaciones" className="hover:text-amber-400 transition font-bold text-amber-400 block">
                  Libro de reclamaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legales y Políticas */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Legales y Políticas
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/terminos-y-condiciones" className="hover:text-amber-400 transition block">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link to="/como-cuidamos-tu-privacidad" className="hover:text-amber-400 transition block">
                  Cómo cuidamos tu privacidad
                </Link>
              </li>
              <li>
                <Link to="/accesibilidad" className="hover:text-amber-400 transition block">
                  Accesibilidad
                </Link>
              </li>
              <li>
                <Link to="/politica-cookies" className="hover:text-amber-400 transition block">
                  Política de cookies
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-bar */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© Todos los derechos reservados • NovaSats Technologies S.A.C.</p>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
            <span>Bitcoin Network Verified</span>
            <span>•</span>
            <span>NovaSats.sol • On-Chain</span>
          </div>
        </div>
      </footer>

      {/* FLOATING SHOPPING CART BUTTON (Bottom-Right Corner) */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black flex items-center justify-center shadow-2xl shadow-amber-500/35 border border-amber-300/40 hover:scale-110 active:scale-95 transition-all duration-300 group"
        title="Ver bolsa de compras"
        aria-label="Ver bolsa de compras"
      >
        <ShoppingBag className="w-6 h-6 text-black stroke-[2.2] group-hover:rotate-6 transition-transform" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 bg-black text-amber-400 font-black text-xs font-mono rounded-full border-2 border-amber-400 flex items-center justify-center shadow-lg animate-bounce">
            {itemCount}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Voucher Result Modal */}
      {showLookupModal && lookupResult && (
        <VoucherModal
          order={lookupResult}
          isOpen={showLookupModal}
          onClose={() => setShowLookupModal(false)}
        />
      )}

    </div>
  );
};
