import React, { useState, useEffect, useMemo } from 'react';
import { SupplierLayout } from './SupplierLayout';
import { useSupplier } from '../../context/SupplierContext';
import { supabase } from '../../lib/supabaseClient';
import { Product } from '../../types/store';
import { encodeProductDescription, parseProductDescription } from '../../lib/productMeta';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  RotateCcw,
  Boxes,
  Save,
  X,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Bitcoin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  Tag,
  Star,
  Plus,
  Minus,
  Layers,
  FileText
} from 'lucide-react';

const BTC_PRICE_USD = 65000;

export const SupplierProducts: React.FC = () => {
  const { supplier } = useSupplier();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'low_stock' | 'archived'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Quick stock edit inline
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);

  // Modal State for Add / Update
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalTab, setModalTab] = useState<'general' | 'pricing' | 'gallery' | 'shipping'>('general');

  // Form Fields (Exact match with ProductDetailPage fields)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hardware Wallets');
  const [sku, setSku] = useState('');
  const [condition, setCondition] = useState('Nuevo en Caja Sellada');
  const [warranty, setWarranty] = useState('12 Meses con NexCoin.sol');
  
  // Pricing & Stock
  const [priceUsd, setPriceUsd] = useState('');
  const [priceBtc, setPriceBtc] = useState('');
  const [stock, setStock] = useState('10');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [originalPriceUsd, setOriginalPriceUsd] = useState('');

  // Gallery (Images)
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');

  // Logistics & Status
  const [shippingType, setShippingType] = useState<'free' | 'express' | 'standard'>('free');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [rating, setRating] = useState('4.9');
  const [reviewsCount, setReviewsCount] = useState('24');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sampleImages = [
    { label: 'Hardware Wallet', url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=800&auto=format&fit=crop' },
    { label: 'Minería Crypto', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop' },
    { label: 'Placa Titanio', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop' },
    { label: 'Crypto Wear', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop' },
    { label: 'Nodo & Red', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop' },
  ];

  const categories = [
    'Hardware Wallets',
    'Billeteras Frías',
    'Minería ASIC',
    'Seguridad',
    'Seguridad & Seed',
    'Merchandising & Arte',
    'Hardware & Nodos',
    'Accesorios Cripto',
    'General'
  ];

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProducts = async () => {
    if (!supplier) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const parsed = (data || []).map((p) => {
        const { cleanDescription, meta } = parseProductDescription(p.description);
        return {
          ...p,
          description: cleanDescription || p.description,
          images: meta.images && meta.images.length > 0 ? meta.images : (p.image_url ? [p.image_url] : []),
          discount_percent: meta.discount_percent ?? (p.discount_percent ?? 0),
          original_price_usd: meta.original_price_usd ?? (p.original_price_usd ?? p.price_usd),
          free_shipping: meta.free_shipping ?? (meta.shipping_type === 'free' || p.price_usd >= 100),
          shipping_type: meta.shipping_type ?? (p.shipping_type ?? 'free'),
          rating: meta.rating ?? (p.rating ?? 4.9),
          reviews_count: meta.reviews_count ?? (p.reviews_count ?? 18)
        };
      });

      setProducts(parsed);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      showToast('error', 'Error al cargar catálogo de productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [supplier]);

  // Open modal for Adding new product
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setModalTab('general');
    setName('');
    setDescription('Producto verificado de alta calidad con garantía criptográfica respaldada en NexCoin.sol v2.0.');
    setCategory('Hardware Wallets');
    setPriceUsd('');
    setPriceBtc('');
    setStock('10');
    setImageUrl('https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=800&auto=format&fit=crop');
    setAdditionalImages([
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop'
    ]);
    setNewImageUrlInput('');
    setSku(`NEX-${Math.floor(1000 + Math.random() * 9000)}`);
    setCondition('Nuevo en Caja Sellada');
    setWarranty('12 Meses con NexCoin.sol');
    setFormStatus('active');
    setDiscountPercent('0');
    setOriginalPriceUsd('');
    setShippingType('free');
    setRating('4.9');
    setReviewsCount('18');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Updating existing product
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setModalTab('general');
    const { cleanDescription, meta } = parseProductDescription(p.description);
    
    setName(p.name);
    setDescription(cleanDescription || p.description || '');
    setCategory(p.category || 'General');
    setPriceUsd(String(p.price_usd));
    setPriceBtc(String(p.price_btc));
    setStock(String(p.stock));
    setImageUrl(p.image_url || '');
    
    const extraImgs = (meta.images || p.images || []).filter(img => img !== p.image_url);
    setAdditionalImages(extraImgs);
    setNewImageUrlInput('');

    setSku(p.sku || `NEX-${Math.floor(1000 + Math.random() * 9000)}`);
    setCondition(meta.condition || 'Nuevo en Caja Sellada');
    setWarranty(meta.warranty || '12 Meses con NexCoin.sol');
    setFormStatus(p.status || 'active');
    setDiscountPercent(String(meta.discount_percent ?? (p.discount_percent ?? 0)));
    setOriginalPriceUsd(meta.original_price_usd ? String(meta.original_price_usd) : String(p.price_usd));
    setShippingType(meta.shipping_type || (p.shipping_type || (p.free_shipping ? 'free' : 'standard')));
    setRating(String(meta.rating ?? (p.rating ?? 4.9)));
    setReviewsCount(String(meta.reviews_count ?? (p.reviews_count ?? 24)));
    setFormError('');
    setIsModalOpen(true);
  };

  const handlePriceUsdChange = (val: string) => {
    setPriceUsd(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setPriceBtc((num / BTC_PRICE_USD).toFixed(6));
      if (!originalPriceUsd || parseFloat(originalPriceUsd) <= num) {
        setOriginalPriceUsd(num.toFixed(2));
      }
    } else {
      setPriceBtc('');
    }
  };

  const handleDiscountChange = (val: string) => {
    setDiscountPercent(val);
    const pct = parseFloat(val);
    const currPrice = parseFloat(priceUsd);
    if (!isNaN(pct) && pct > 0 && !isNaN(currPrice) && currPrice > 0) {
      // Calculate original price before discount
      const orig = currPrice / (1 - pct / 100);
      setOriginalPriceUsd(orig.toFixed(2));
    }
  };

  const handleAddAdditionalImage = () => {
    if (!newImageUrlInput.trim()) return;
    if (!newImageUrlInput.startsWith('http://') && !newImageUrlInput.startsWith('https://')) {
      showToast('error', 'La URL de la imagen debe comenzar con https://');
      return;
    }
    setAdditionalImages((prev) => [...prev, newImageUrlInput.trim()]);
    setNewImageUrlInput('');
  };

  const handleRemoveAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Save product (Insert or Update with embedded metadata)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    if (!name.trim() || !priceUsd || !stock) {
      setFormError('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const parsedPriceUsd = parseFloat(priceUsd);
      const parsedPriceBtc = parseFloat(priceBtc) || parsedPriceUsd / BTC_PRICE_USD;
      const parsedStock = parseInt(stock) || 0;
      const parsedDiscount = parseInt(discountPercent) || 0;
      const parsedOrigPrice = originalPriceUsd ? parseFloat(originalPriceUsd) : parsedPriceUsd;

      // Gallery array: primary image followed by additional images
      const allGalleryImages = [
        imageUrl.trim() || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=800',
        ...additionalImages.filter(Boolean)
      ];

      // Encode extended metadata into description
      const fullDescription = encodeProductDescription(description, {
        images: allGalleryImages,
        discount_percent: parsedDiscount,
        original_price_usd: parsedOrigPrice,
        shipping_type: shippingType,
        free_shipping: shippingType === 'free',
        rating: parseFloat(rating) || 4.9,
        reviews_count: parseInt(reviewsCount) || 20,
        warranty: warranty.trim(),
        condition: condition.trim()
      });

      // Payload strictly conforming to Supabase products table schema
      const payload: any = {
        supplier_id: supplier.id,
        name: name.trim(),
        description: fullDescription,
        category: category.trim(),
        price_usd: parsedPriceUsd,
        price_btc: parsedPriceBtc,
        stock: parsedStock,
        image_url: imageUrl.trim() || allGalleryImages[0],
        sku: sku.trim() || `NEX-${Date.now().toString().slice(-5)}`,
        status: formStatus,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) throw error;
        showToast('success', `Producto "${name}" actualizado con éxito`);
      } else {
        payload.created_at = new Date().toISOString();
        const { error } = await supabase
          .from('products')
          .insert([payload]);

        if (error) throw error;
        showToast('success', `Producto "${name}" publicado en la tienda`);
      }

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setFormError(err.message || 'Error al guardar el producto.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick inline stock updater (+1, -1, or direct edit)
  const handleQuickStockUpdate = async (productId: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    setUpdatingStockId(productId);

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: nextStock, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: nextStock } : p))
      );
    } catch (err) {
      console.error('Error updating stock inline:', err);
      showToast('error', 'No se pudo actualizar el stock');
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Archive / Deactivate Product
  const handleDeactivateProduct = async (id: string, prodName: string) => {
    if (!window.confirm(`¿Seguro que deseas archivar "${prodName}"? Ocultará el producto de la tienda.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      showToast('success', `"${prodName}" fue archivado.`);
      await fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Error al archivar');
    }
  };

  // Reactivate Product
  const handleReactivateProduct = async (id: string, prodName: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      showToast('success', `"${prodName}" volvió a estar activo.`);
      await fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Error al reactivar');
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      let matchesTab = true;
      if (filterTab === 'active') matchesTab = p.status === 'active' && p.stock > 0;
      else if (filterTab === 'low_stock') matchesTab = p.stock <= 5;
      else if (filterTab === 'archived') matchesTab = p.status === 'archived';

      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [products, search, filterTab, selectedCategory]);

  // Summary Metrics
  const activeCount = products.filter((p) => p.status === 'active').length;
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalInventoryUsd = products.reduce((sum, p) => sum + (p.price_usd || 0) * (p.stock || 0), 0);
  const totalInventoryBtc = totalInventoryUsd / BTC_PRICE_USD;

  return (
    <SupplierLayout
      title="Mis Productos & Catálogo"
      subtitle="Gestiona tu inventario con todos los campos sincronizados con la página de producto y la red Bitcoin."
    >
      <div className="space-y-8 w-full max-w-full">
        
        {/* TOAST MESSAGE */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-4 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/95 border-red-500/40 text-red-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-semibold">{toastMessage.text}</span>
          </div>
        )}

        {/* TOP KPI CARDS BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#090d18] border border-white/[0.08] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Catálogo</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-2 font-heading">{products.length}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">{activeCount} activos</span> en tienda
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#090d18] border border-white/[0.08] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Existencias Físicas</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-2 font-heading">{totalStockUnits}</p>
            <p className="text-[11px] text-slate-400 mt-1">Unidades totales listas para despacho</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#090d18] border border-white/[0.08] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Valor Inventario (USD)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 font-mono">
              ${totalInventoryUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Valor de mercado cotizado</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#090d18] border border-white/[0.08] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Valor On-Chain (BTC)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bitcoin className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 font-mono">
              {totalInventoryBtc.toFixed(4)} ₿
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Liquidación directa en wallet</p>
          </div>
        </div>

        {/* TOOLBAR: ACTION BUTTON + FILTERS */}
        <div className="bg-[#0b101e] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título, SKU o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>

            {/* Top Right: Primary Create Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Publicar Nuevo Producto</span>
              </button>
            </div>

          </div>

          {/* Quick Filter Tabs & Category Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/40 border border-white/[0.06] rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterTab === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('active')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterTab === 'active'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Activos ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('low_stock')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterTab === 'low_stock'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bajo Stock / 0 ({products.filter((p) => p.stock <= 5).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('archived')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterTab === 'archived'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Archivados ({products.filter((p) => p.status === 'archived').length})
              </button>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Categoría:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#060911] border border-white/[0.1] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* PRODUCTS TABLE CONTAINER */}
        <div className="bg-[#090d18] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-400">Cargando inventario de la blockchain...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 px-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">No se encontraron productos</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {search || selectedCategory !== 'all' || filterTab !== 'all'
                  ? 'No hay productos que coincidan con los filtros seleccionados.'
                  : 'Aún no has registrado ningún producto. Empieza publicando tu primer artículo en la tienda.'}
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publicar mi Primer Producto</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto lateral-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#0c1222] text-slate-400 uppercase tracking-wider font-semibold font-mono text-[11px]">
                    <th className="py-4 px-6">Producto & Detalles</th>
                    <th className="py-4 px-3">SKU & Categoría</th>
                    <th className="py-4 px-3 text-right">Precio USD</th>
                    <th className="py-4 px-3 text-right">Precio BTC</th>
                    <th className="py-4 px-4 text-center">Stock</th>
                    <th className="py-4 px-3 text-center">Envíos</th>
                    <th className="py-4 px-3 text-center">Estado</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] font-medium">
                  {filteredProducts.map((p) => {
                    const isArchived = p.status === 'archived';
                    const hasDiscount = Boolean(p.discount_percent && p.discount_percent > 0);
                    const isFreeShipping = p.free_shipping || p.shipping_type === 'free';

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          isArchived ? 'opacity-50 bg-black/20' : ''
                        }`}
                      >
                        {/* Producto & Thumbnail */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5 min-w-[240px]">
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/50 border border-white/[0.1] shrink-0 group">
                              <img
                                src={p.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200'}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              {p.images && p.images.length > 1 && (
                                <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-[9px] font-mono text-white rounded">
                                  +{p.images.length - 1}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-white text-xs truncate hover:text-amber-400 transition" title={p.name}>
                                {p.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5" title={p.description}>
                                {p.description || 'Sin descripción'}
                              </p>
                              {hasDiscount && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  -{p.discount_percent}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SKU & Categoría */}
                        <td className="py-4 px-3 min-w-[130px]">
                          <span className="font-mono text-[11px] text-amber-400 font-bold block">
                            {p.sku || 'SIN-SKU'}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06] inline-block mt-1">
                            {p.category || 'General'}
                          </span>
                        </td>

                        {/* Precio USD */}
                        <td className="py-4 px-3 text-right font-mono font-bold text-white min-w-[100px]">
                          ${p.price_usd?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          {p.original_price_usd && p.original_price_usd > p.price_usd && (
                            <span className="block text-[10px] text-slate-500 line-through">
                              ${p.original_price_usd.toFixed(2)}
                            </span>
                          )}
                        </td>

                        {/* Precio BTC */}
                        <td className="py-4 px-3 text-right font-mono font-bold text-amber-400 min-w-[110px]">
                          {p.price_btc ? `${p.price_btc.toFixed(6)} ₿` : `${(p.price_usd / BTC_PRICE_USD).toFixed(6)} ₿`}
                        </td>

                        {/* Quick Stock Controls */}
                        <td className="py-4 px-4 text-center min-w-[130px]">
                          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#060911] border border-white/[0.08]">
                            <button
                              type="button"
                              onClick={() => handleQuickStockUpdate(p.id, p.stock, -1)}
                              disabled={updatingStockId === p.id || p.stock <= 0}
                              className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 flex items-center justify-center disabled:opacity-30 transition"
                              title="Restar 1 unidad"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span
                              className={`font-mono text-xs font-bold px-2 ${
                                p.stock > 10
                                  ? 'text-emerald-400'
                                  : p.stock > 0
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {p.stock}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleQuickStockUpdate(p.id, p.stock, 1)}
                              disabled={updatingStockId === p.id}
                              className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 flex items-center justify-center disabled:opacity-30 transition"
                              title="Sumar 1 unidad"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Envíos */}
                        <td className="py-4 px-3 text-center min-w-[100px]">
                          {isFreeShipping ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <Truck className="w-3 h-3" />
                              Gratis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06]">
                              {p.shipping_type === 'express' ? 'Express' : 'Estándar'}
                            </span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-4 px-3 text-center min-w-[90px]">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-white/[0.08]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                              }`}
                            />
                            {p.status === 'active' ? 'Activo' : 'Archivado'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-4 px-6 text-right min-w-[180px]">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* BOTÓN: VER EN TIENDA (Link directo a la página de producto) */}
                            <Link
                              to={`/producto/${p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition border border-transparent hover:border-amber-500/30"
                              title="Ver producto en la tienda pública"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            {/* BOTÓN: EDITAR PRODUCTO */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              className="p-2 text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition border border-transparent hover:border-amber-500/30"
                              title="Editar información completa del producto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* BOTÓN: ARCHIVAR O REACTIVAR */}
                            {isArchived ? (
                              <button
                                type="button"
                                onClick={() => handleReactivateProduct(p.id, p.name)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-[11px] font-bold transition"
                                title="Volver a activar en la tienda"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Activar</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeactivateProduct(p.id, p.name)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                                title="Archivar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MODAL PROFESIONAL MULTI-PESTAÑA PARA AGREGAR O ACTUALIZAR PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#090e1a] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#0c1322]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white font-heading">
                    {editingProduct ? 'Editar Producto Completo' : 'Publicar Nuevo Producto en Tienda'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {editingProduct ? `ID: ${editingProduct.id}` : 'Sincronizado con Smart Contract y Liquidación Bitcoin'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/[0.06] bg-[#070a13] overflow-x-auto text-xs font-bold scrollbar-none">
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition shrink-0 ${
                  modalTab === 'general'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>1. Información General</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('pricing')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition shrink-0 ${
                  modalTab === 'pricing'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>2. Precios & Promociones</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('gallery')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition shrink-0 ${
                  modalTab === 'gallery'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>3. Galería de Fotos (Carrusel)</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('shipping')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition shrink-0 ${
                  modalTab === 'shipping'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>4. Logística & Garantía</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto lateral-scrollbar flex-1 space-y-6">
              
              {formError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <form id="productForm" onSubmit={handleSaveProduct} className="space-y-6">
                
                {/* TAB 1: INFORMACIÓN GENERAL */}
                {modalTab === 'general' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Título del Producto *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Hardware Wallet Ledger Nano X Black Edition"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Categoría en la Tienda *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Código SKU / Referencia
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="NEX-HW-001"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            className="flex-1 bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => setSku(`NEX-${Math.floor(1000 + Math.random() * 9000)}`)}
                            className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-slate-300 rounded-xl border border-white/[0.08]"
                          >
                            Generar
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Condición del Producto
                        </label>
                        <select
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="Nuevo en Caja Sellada">Nuevo en Caja Sellada (Original)</option>
                          <option value="Reacondicionado Grado A">Reacondicionado Grado A</option>
                          <option value="Edición Limitada Coleccionable">Edición Limitada Coleccionable</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Garantía Criptográfica
                        </label>
                        <input
                          type="text"
                          placeholder="12 Meses con NexCoin.sol"
                          value={warranty}
                          onChange={(e) => setWarranty(e.target.value)}
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Descripción Completa y Ficha Técnica
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Describe el producto, compatibilidad, protocolos soportados, materiales y precinto de fábrica..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
                        />
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 2: PRECIOS, DESCUENTOS Y STOCK */}
                {modalTab === 'pricing' && (
                  <div className="space-y-6">
                    
                    <div className="p-4 rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 text-xs text-slate-300 flex items-center justify-between">
                      <span className="font-mono text-amber-400 font-bold">Conversión Oficial: 1 BTC = ${BTC_PRICE_USD.toLocaleString()} USD</span>
                      <span className="text-[11px] text-slate-400">Contrato Inteligente NexCoin</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* Precio USD */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Precio en Dólares ($ USD) *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="149.00"
                            value={priceUsd}
                            onChange={(e) => handlePriceUsdChange(e.target.value)}
                            className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Precio BTC */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Precio en Bitcoin (₿ BTC)
                        </label>
                        <div className="relative">
                          <Bitcoin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                          <input
                            type="number"
                            step="0.000001"
                            min="0"
                            placeholder="0.002292"
                            value={priceBtc}
                            onChange={(e) => setPriceBtc(e.target.value)}
                            className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Stock */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Stock Disponible (Unidades) *
                        </label>
                        <div className="relative">
                          <Boxes className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="number"
                            min="0"
                            required
                            placeholder="15"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Promociones & Descuentos */}
                    <div className="p-5 rounded-2xl bg-[#070a14] border border-white/[0.08] space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          <span>Oferta Promocional (% OFF)</span>
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">Visible como etiqueta roja en tienda</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Porcentaje de Descuento (0 - 90%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="90"
                              placeholder="15"
                              value={discountPercent}
                              onChange={(e) => handleDiscountChange(e.target.value)}
                              className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono font-bold">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Precio Original Tachado ($ USD)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Precio tachado anterior"
                            value={originalPriceUsd}
                            onChange={(e) => setOriginalPriceUsd(e.target.value)}
                            className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 3: GALERÍA DE FOTOS (CARRUSEL) */}
                {modalTab === 'gallery' && (
                  <div className="space-y-6">
                    
                    {/* Imagen Principal */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Foto Principal de Portada (HTTPS) *
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://images.unsplash.com/..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />

                      {/* Plantillas de Unsplash */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500">Plantillas rápidas:</span>
                        {sampleImages.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setImageUrl(s.url)}
                            className="text-[10px] px-2 py-0.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded border border-white/[0.06] transition"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lista Dinámica de Fotos Secundarias para el Carrusel */}
                    <div className="p-5 rounded-2xl bg-[#070a14] border border-white/[0.08] space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>Fotos Secundarias para el Carrusel de la Página de Detalle</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Los compradores podrán navegar entre estas imágenes mediante las flechas del carrusel en la página del producto.
                        </p>
                      </div>

                      {/* Input para agregar nueva foto */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Pega la URL de una foto secundaria (https://...)"
                          value={newImageUrlInput}
                          onChange={(e) => setNewImageUrlInput(e.target.value)}
                          className="flex-1 bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddAdditionalImage}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar Foto</span>
                        </button>
                      </div>

                      {/* Galería en Miniatura con previews */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {/* Tarjeta de imagen principal */}
                        <div className="relative rounded-xl overflow-hidden bg-black/50 border-2 border-amber-400 p-1">
                          <img
                            src={imageUrl || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=400'}
                            alt="Principal"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black uppercase rounded shadow">
                            Portada
                          </span>
                        </div>

                        {/* Tarjetas de fotos adicionales */}
                        {additionalImages.map((imgUrl, idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden bg-black/50 border border-white/[0.1] p-1 group">
                            <img
                              src={imgUrl}
                              alt={`Secundaria ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/80 text-white text-[9px] font-mono rounded">
                              Foto {idx + 2}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditionalImage(idx)}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition shadow"
                              title="Eliminar foto de la galería"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 4: LOGÍSTICA & ESTADO */}
                {modalTab === 'shipping' && (
                  <div className="space-y-5">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Tipo de Envío */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Modalidad de Envío
                        </label>
                        <select
                          value={shippingType}
                          onChange={(e) => setShippingType(e.target.value as any)}
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="free">Envío Gratis a todo el país (24 - 48h)</option>
                          <option value="express">Envío Express Prioritario (24h)</option>
                          <option value="standard">Envío Estándar con Seguimiento (2 - 4 días)</option>
                        </select>
                      </div>

                      {/* Estado en Tienda */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Visibilidad Comercial
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="active">Activo (Visible en el catálogo público)</option>
                          <option value="archived">Archivado / Privado (Oculto de la tienda)</option>
                        </select>
                      </div>

                      {/* Calificación Inicial */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Calificación del Producto (Estrellas)
                        </label>
                        <div className="relative">
                          <Star className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            placeholder="4.9"
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Reseñas Iniciales */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Cantidad de Opiniones Verificadas
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="24"
                          value={reviewsCount}
                          onChange={(e) => setReviewsCount(e.target.value)}
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                    </div>

                    <div className="p-4 rounded-2xl bg-[#070a14] border border-white/[0.08] flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Este producto quedará registrado bajo tu firma de proveedor (<strong className="text-white font-mono">{supplier?.company_name || 'Proveedor'}</strong>) y admitirá transacciones automáticas con comprobantes inmutables.
                      </p>
                    </div>

                  </div>
                )}

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#0c1322] flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Pestaña actual: <strong className="text-amber-400 font-mono uppercase">{modalTab}</strong>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  form="productForm"
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 transition disabled:opacity-50 active:scale-95"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>{formSubmitting ? 'Guardando en Blockchain...' : editingProduct ? 'Actualizar Producto' : 'Publicar Producto'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </SupplierLayout>
  );
};
