import React, { useState, useEffect } from 'react';
import { SupplierLayout } from './SupplierLayout';
import { useSupplier } from '../../context/SupplierContext';
import { supabase } from '../../lib/supabaseClient';
import { Product } from '../../types/store';
import {
  Package,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Bitcoin,
  Boxes,
  Save,
  X,
  AlertCircle
} from 'lucide-react';

const BTC_PRICE_USD = 65000;

export const SupplierProducts: React.FC = () => {
  const { supplier } = useSupplier();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'out_of_stock' | 'archived'>('all');

  // Quick stock edit inline
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);

  // Modal State for Add / Update
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hardware Wallets');
  const [priceUsd, setPriceUsd] = useState('');
  const [priceBtc, setPriceBtc] = useState('');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [sku, setSku] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [originalPriceUsd, setOriginalPriceUsd] = useState('');
  const [shippingType, setShippingType] = useState<'free' | 'express' | 'standard'>('free');
  const [additionalImagesText, setAdditionalImagesText] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sampleImages = [
    { label: 'Hardware Wallet', url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=600' },
    { label: 'Minería Crypto', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600' },
    { label: 'Polerón / Ropa', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600' },
    { label: 'Placa Titanio', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600' },
    { label: 'Arte Bitcoin', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600' },
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
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      showToast('error', 'Error al cargar productos');
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
    setName('');
    setDescription('');
    setCategory('Hardware Wallets');
    setPriceUsd('');
    setPriceBtc('');
    setStock('10');
    setImageUrl('https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=600');
    setSku(`SKU-${Date.now().toString().slice(-5)}`);
    setFormStatus('active');
    setDiscountPercent('0');
    setOriginalPriceUsd('');
    setShippingType('free');
    setAdditionalImagesText('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Updating existing product
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setCategory(p.category || 'General');
    setPriceUsd(String(p.price_usd));
    setPriceBtc(String(p.price_btc));
    setStock(String(p.stock));
    setImageUrl(p.image_url || '');
    setSku(p.sku || '');
    setFormStatus(p.status || 'active');
    setDiscountPercent(String(p.discount_percent || 0));
    setOriginalPriceUsd(p.original_price_usd ? String(p.original_price_usd) : '');
    setShippingType(p.shipping_type || (p.free_shipping ? 'free' : 'standard'));
    setAdditionalImagesText(p.images && p.images.length > 1 ? p.images.slice(1).join('\n') : '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handlePriceUsdChange = (val: string) => {
    setPriceUsd(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setPriceBtc((num / BTC_PRICE_USD).toFixed(8));
    } else {
      setPriceBtc('');
    }
  };

  // Save or update product in Supabase
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    if (!name.trim() || !priceUsd || !stock) {
      setFormError('Completa todos los campos obligatorios.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const payload = {
        supplier_id: supplier.id,
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        price_usd: parseFloat(priceUsd),
        price_btc: parseFloat(priceBtc) || parseFloat(priceUsd) / BTC_PRICE_USD,
        stock: parseInt(stock) || 0,
        image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
        images: [
          imageUrl.trim() || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
          ...additionalImagesText.split('\n').map(s => s.trim()).filter(Boolean)
        ],
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
        discount_percent: parseInt(discountPercent) || 0,
        original_price_usd: originalPriceUsd ? parseFloat(originalPriceUsd) : parseFloat(priceUsd),
        shipping_type: shippingType,
        free_shipping: shippingType === 'free',
        status: formStatus,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        // Update
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) throw error;
        showToast('success', `Producto "${name}" actualizado con éxito.`);
      } else {
        // Create
        const { error } = await supabase
          .from('products')
          .insert([payload]);

        if (error) throw error;
        showToast('success', `Producto "${name}" agregado con éxito al catálogo.`);
      }

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el producto.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Desactivar / Eliminar (Cambiar estado a 'archived')
  const handleDeactivateProduct = async (id: string, prodName: string) => {
    if (!window.confirm(`¿Deseas desactivar / eliminar el producto "${prodName}" de la tienda? Podrás volver a activarlo en cualquier momento.`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'archived' } : p))
      );
      showToast('success', `Producto "${prodName}" desactivado. Ya no se mostrará a los clientes.`);
    } catch (err: any) {
      showToast('error', `Error al desactivar: ${err.message}`);
    }
  };

  // Volver a Activar Producto (Cambiar estado a 'active')
  const handleReactivateProduct = async (id: string, prodName: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'active' } : p))
      );
      showToast('success', `¡Producto "${prodName}" reactivado! Ya está visible nuevamente en la tienda.`);
    } catch (err: any) {
      showToast('error', `Error al reactivar: ${err.message}`);
    }
  };

  // Inline quick stock save
  const handleSaveStock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: tempStock, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: tempStock } : p))
      );
      setEditingStockId(null);
      showToast('success', 'Stock de existencias actualizado.');
    } catch (err: any) {
      showToast('error', `Error al actualizar stock: ${err.message}`);
    }
  };

  // Filtered products logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());

    if (filterTab === 'active') {
      return matchesSearch && p.status !== 'archived';
    }
    if (filterTab === 'out_of_stock') {
      return matchesSearch && p.stock <= 0 && p.status !== 'archived';
    }
    if (filterTab === 'archived') {
      return matchesSearch && p.status === 'archived';
    }
    return matchesSearch;
  });

  const activeCount = products.filter((p) => p.status !== 'archived').length;
  const outOfStockCount = products.filter((p) => p.stock <= 0 && p.status !== 'archived').length;
  const archivedCount = products.filter((p) => p.status === 'archived').length;

  return (
    <SupplierLayout
      title="Mis Productos"
      subtitle="Gestiona el catálogo, agrega o actualiza artículos con el modal, y activa o desactiva productos en tiempo real"
    >
      <div className="space-y-6 w-full max-w-full">
        
        {/* Toast Feedback */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all shadow-xl animate-fade-in ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Controls & Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0a0f1d] border border-white/[0.08] p-4 rounded-2xl w-full">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Filter Tabs & Modal Trigger Button */}
          <div className="flex flex-wrap items-center gap-2">
            
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterTab === 'all'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'bg-[#0e1424] text-slate-300 hover:bg-[#151e36]'
              }`}
            >
              Todos ({products.length})
            </button>

            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterTab === 'active'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'bg-[#0e1424] text-slate-300 hover:bg-[#151e36]'
              }`}
            >
              Activos ({activeCount})
            </button>

            <button
              onClick={() => setFilterTab('out_of_stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                filterTab === 'out_of_stock'
                  ? 'bg-amber-600 text-white font-bold shadow'
                  : 'bg-[#0e1424] text-amber-400 hover:bg-[#151e36]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Sin Stock ({outOfStockCount})</span>
            </button>

            <button
              onClick={() => setFilterTab('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                filterTab === 'archived'
                  ? 'bg-red-600 text-white font-bold shadow'
                  : 'bg-[#0e1424] text-red-400 hover:bg-[#151e36]'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Inactivos / Eliminados ({archivedCount})</span>
            </button>

            {/* BUTTON: Open Modal to Add Product */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/15 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agregar Producto</span>
            </button>

          </div>
        </div>

        {/* Full Width Table of Products */}
        <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl w-full">
          {loading ? (
            <div className="p-16 text-center text-slate-400 animate-pulse font-medium">
              Cargando catálogo de productos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <Package className="w-14 h-14 mx-auto mb-2 opacity-40" />
              <p className="text-base font-bold text-slate-300">No se encontraron productos en esta sección</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {filterTab === 'archived'
                  ? 'No tienes productos eliminados o archivados.'
                  : 'Haz clic en "Agregar Producto" para crear uno nuevo con el modal.'}
              </p>
              {filterTab !== 'archived' && (
                <button
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-xl shadow hover:bg-amber-400 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear Primer Producto</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto lateral-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#070a13] text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-4 px-5">Producto</th>
                    <th className="py-4 px-3">Categoría</th>
                    <th className="py-4 px-3">SKU</th>
                    <th className="py-4 px-3 text-right">Precio USD</th>
                    <th className="py-4 px-3 text-right">Precio BTC</th>
                    <th className="py-4 px-4 text-center">Stock</th>
                    <th className="py-4 px-4 text-center">Estado</th>
                    <th className="py-4 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] font-medium">
                  {filteredProducts.map((p) => {
                    const isArchived = p.status === 'archived';
                    const isZeroStock = p.stock <= 0;
                    const isEditingStock = editingStockId === p.id;

                    return (
                      <tr
                        key={p.id}
                        className={`transition ${
                          isArchived ? 'bg-red-950/10 opacity-75' : 'hover:bg-slate-850/40'
                        }`}
                      >
                        {/* Name & Thumbnail */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100'}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-white/[0.08] shrink-0"
                            />
                            <div className="min-w-0 max-w-xs">
                              <p className={`text-xs font-bold truncate ${isArchived ? 'text-slate-400 line-through' : 'text-white'}`}>
                                {p.name}
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-slate-300">{p.category}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-400">{p.sku || '—'}</td>

                        <td className="py-3.5 px-3 text-right font-bold text-white">
                          ${Number(p.price_usd).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono text-amber-400 font-semibold">
                          {Number(p.price_btc).toFixed(8)} ₿
                        </td>

                        {/* Stock Column with Inline Edit */}
                        <td className="py-3.5 px-4 text-center">
                          {isEditingStock ? (
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={tempStock}
                                onChange={(e) => setTempStock(parseInt(e.target.value) || 0)}
                                className="w-16 bg-[#060911] border border-amber-500 rounded px-2 py-1 text-center text-xs text-white"
                              />
                              <button
                                onClick={() => handleSaveStock(p.id)}
                                className="px-2 py-1 bg-amber-500 text-black font-bold rounded text-[10px]"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingStockId(null)}
                                className="text-slate-400 hover:text-white text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingStockId(p.id);
                                setTempStock(p.stock);
                              }}
                              className="cursor-pointer group inline-flex items-center gap-1.5"
                              title="Haz clic para modificar el stock rápidamente"
                            >
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                  isZeroStock
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {isZeroStock ? '0 (Agotado)' : `${p.stock} uds.`}
                              </span>
                              <Edit className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {isArchived ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              Inactivo / Eliminado
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Activo en Tienda
                            </span>
                          )}
                        </td>

                        {/* Actions: Update Modal, Delete / Reactivate */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            
                            {/* Update Button (Opens Modal) */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
                              title="Editar producto con el modal"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* If archived: SHOW VOLVER A ACTIVAR BUTTON */}
                            {isArchived ? (
                              <button
                                type="button"
                                onClick={() => handleReactivateProduct(p.id, p.name)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                title="Volver a activar producto en la tienda"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Volver a Activar</span>
                              </button>
                            ) : (
                              /* If active: SHOW DELETE / DEACTIVATE BUTTON */
                              <button
                                type="button"
                                onClick={() => handleDeactivateProduct(p.id, p.name)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                                title="Eliminar / Desactivar producto"
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

      {/* MODAL PARA AGREGAR O ACTUALIZAR PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#0b101d] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#0e1526]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">
                    {editingProduct ? 'Actualizar Producto' : 'Agregar Nuevo Producto'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingProduct ? `Editando ID: ${editingProduct.id}` : 'Publicación en el catálogo oficial de NexCoin'}
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

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto lateral-scrollbar flex-1">
              
              {formError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              <form id="productForm" onSubmit={handleSaveProduct} className="space-y-6">
                
                {/* General Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-2">
                    Información Básica
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nombre del Producto *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Hardware Wallet Ledger Nano X"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Categoría *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Billeteras Frías">Billeteras Frías</option>
                        <option value="Minería ASIC">Minería ASIC</option>
                        <option value="Seguridad & Seed">Seguridad & Seed</option>
                        <option value="Merchandising & Arte">Merchandising & Arte</option>
                        <option value="Hardware & Nodos">Hardware & Nodos</option>
                        <option value="Accesorios Cripto">Accesorios Cripto</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Código SKU
                      </label>
                      <input
                        type="text"
                        placeholder="NX-SKU-001"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Descripción del Producto
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Características técnicas, garantía, compatibilidad..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Precios y Stock */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-2">
                    Precios y Existencias en Almacén
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Precio en Bitcoin (₿ BTC)
                      </label>
                      <div className="relative">
                        <Bitcoin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                        <input
                          type="number"
                          step="0.00000001"
                          min="0"
                          placeholder="0.00229000"
                          value={priceBtc}
                          onChange={(e) => setPriceBtc(e.target.value)}
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Cantidad en Stock *
                      </label>
                      <div className="relative">
                        <Boxes className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="25"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Imagen */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.08] pb-2">
                    Imagen del Producto
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      URL de la Imagen (HTTPS)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">Plantillas rápidas:</span>
                    {sampleImages.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(s.url)}
                        className="text-[11px] px-2.5 py-1 bg-[#060911] hover:bg-slate-800 text-slate-300 rounded-lg border border-white/[0.08]"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {imageUrl && (
                    <div className="p-3 bg-[#060911] rounded-2xl border border-white/[0.08] flex items-center gap-4 max-w-sm mt-2">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-14 h-14 object-cover rounded-xl bg-slate-900 shrink-0"
                      />
                      <div className="min-w-0 text-xs">
                        <p className="font-bold text-white">Vista Previa</p>
                        <p className="text-[10px] text-emerald-400">Imagen lista</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Estado Inicial */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estado en Tienda
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white"
                  >
                    <option value="active">Activo (Visible en tienda)</option>
                    <option value="archived">Archivado / Inactivo (Oculto)</option>
                  </select>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/[0.08] bg-[#0e1526] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                form="productForm"
                type="submit"
                disabled={formSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{formSubmitting ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </SupplierLayout>
  );
};
