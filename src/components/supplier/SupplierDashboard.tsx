import React, { useState, useEffect } from 'react';
import { SupplierLayout } from './SupplierLayout';
import { useSupplier } from '../../context/SupplierContext';
import { supabase } from '../../lib/supabaseClient';
import { Product, Order } from '../../types/store';
import { VoucherModal } from '../shared/VoucherModal';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Bitcoin,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  Star
} from 'lucide-react';
import { fetchSupplierReviews } from '../../lib/qaAndReviewsService';

interface SoldProductSummary {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  revenueUsd: number;
  revenueBtc: number;
  currentStock: number;
}

export const SupplierDashboard: React.FC = () => {
  const { supplier } = useSupplier();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [soldProducts, setSoldProducts] = useState<SoldProductSummary[]>([]);
  const [supplierRating, setSupplierRating] = useState<number>(0.0);
  const [supplierReviewsCount, setSupplierReviewsCount] = useState<number>(0);
  const [_loading, setLoading] = useState(true);

  // Voucher modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Quick stock update modal
  const [editingStockProduct, setEditingStockProduct] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(10);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const fetchDashboardData = async () => {
    if (!supplier) return;
    setLoading(true);

    try {
      // 1. Fetch supplier products
      const { data: prodsData, error: prodsError } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false });

      if (prodsError) throw prodsError;
      const supplierProducts = prodsData || [];
      setProducts(supplierProducts);

      // 2. Fetch order items for this supplier
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, orders(*)')
        .eq('supplier_id', supplier.id);

      if (itemsError) throw itemsError;

      // Group sold products
      const soldMap: { [id: string]: SoldProductSummary } = {};
      const orderMap: { [orderId: string]: Order } = {};

      if (itemsData && itemsData.length > 0) {
        itemsData.forEach((item: any) => {
          // Accumulate sold product
          const pId = item.product_id || item.product_name;
          if (!soldMap[pId]) {
            const matchedProd = supplierProducts.find((p) => p.id === pId);
            soldMap[pId] = {
              productId: pId,
              name: item.product_name,
              category: matchedProd?.category || 'General',
              unitsSold: 0,
              revenueUsd: 0,
              revenueBtc: 0,
              currentStock: matchedProd?.stock ?? 0,
            };
          }
          soldMap[pId].unitsSold += Number(item.quantity);
          soldMap[pId].revenueUsd += Number(item.total_usd);
          soldMap[pId].revenueBtc += Number(item.total_btc);

          // Accumulate order
          if (item.orders) {
            if (!orderMap[item.orders.id]) {
              orderMap[item.orders.id] = {
                ...item.orders,
                items: [],
              };
            }
            orderMap[item.orders.id].items?.push(item);
          }
        });
      }

      setSoldProducts(Object.values(soldMap).sort((a, b) => b.unitsSold - a.unitsSold));
      setOrders(Object.values(orderMap).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      // 3. Fetch real ratings & reviews for this supplier
      try {
        const revs = await fetchSupplierReviews(supplier.id);
        if (revs && revs.length > 0) {
          const sum = revs.reduce((acc, r) => acc + r.rating, 0);
          setSupplierRating(Number((sum / revs.length).toFixed(1)));
          setSupplierReviewsCount(revs.length);
        } else {
          setSupplierRating(0.0);
          setSupplierReviewsCount(0);
        }
      } catch (revErr) {
        console.error('Error fetching supplier reviews in dashboard:', revErr);
      }
    } catch (err) {
      console.error('Error fetching supplier dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [supplier]);

  // Derived stats
  const totalRevenueUsd = orders.reduce((sum, ord) => sum + Number(ord.total_usd), 0);
  const totalRevenueBtc = orders.reduce((sum, ord) => sum + Number(ord.total_btc), 0);
  const outOfStockProducts = products.filter((p) => p.stock <= 0);

  const handleOpenVoucher = (order: Order) => {
    setSelectedOrder(order);
    setShowVoucherModal(true);
  };

  const handleUpdateStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockProduct) return;

    setIsUpdatingStock(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStockValue, updated_at: new Date().toISOString() })
        .eq('id', editingStockProduct.id);

      if (error) throw error;
      setEditingStockProduct(null);
      await fetchDashboardData();
    } catch (err: any) {
      alert(`Error al actualizar stock: ${err.message}`);
    } finally {
      setIsUpdatingStock(false);
    }
  };

  return (
    <SupplierLayout
      title="Dashboard General"
      subtitle={`Panel de control comercial y liquidaciones on-chain de ${supplier?.company_name || 'Proveedor'}`}
    >
      <div className="space-y-8 w-full max-w-full">
        {_loading ? (
          <div className="space-y-8 animate-pulse">
            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-[#0a0f1d] border border-white/[0.06] p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-white/[0.06] rounded w-24" />
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-7 bg-white/[0.06] rounded w-32" />
                    <div className="h-3 bg-white/[0.04] rounded w-20" />
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Section Skeleton */}
            <div className="bg-[#0a0f1d] border border-white/[0.06] rounded-3xl p-6 space-y-4">
              <div className="h-5 bg-white/[0.06] rounded w-48" />
              <div className="h-3 bg-white/[0.04] rounded w-64" />
              <div className="space-y-3 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-white/[0.03] rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
              
              {/* Revenue USD */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0e1628]/90 to-[#0a0f1d]/90 border border-white/[0.08] p-5 shadow-xl hover:border-emerald-500/30 transition group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ingresos Totales (USD)</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition shadow-inner">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    ${totalRevenueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <TrendingUp className="w-3 h-3" />
                      Liquidado On-Chain
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue BTC */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0e1628]/90 to-[#0a0f1d]/90 border border-white/[0.08] p-5 shadow-xl hover:border-amber-500/30 transition group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recaudación Bitcoin</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition shadow-inner">
                    <Bitcoin className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
                    {totalRevenueBtc.toFixed(8)} <span className="text-sm font-sans font-bold text-amber-500/80">₿</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    Pagos confirmados en la red
                  </p>
                </div>
              </div>

              {/* Total Orders */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0e1628]/90 to-[#0a0f1d]/90 border border-white/[0.08] p-5 shadow-xl hover:border-blue-500/30 transition group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pedidos & Ventas</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition shadow-inner">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{orders.length}</p>
                  <p className="text-[11px] text-blue-400 mt-2 font-medium">
                    Vouchers emitidos a clientes
                  </p>
                </div>
              </div>

              {/* Supplier Rating KPI Card */}
              <Link
                to="/proveedores/calificaciones"
                className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0e1628]/90 to-[#0a0f1d]/90 border border-white/[0.08] p-5 shadow-xl hover:border-amber-500/40 transition group block"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calificación Proveedor</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition shadow-inner">
                    <Star className="w-5 h-5 fill-amber-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight font-heading">
                      {supplierRating.toFixed(1)}
                    </p>
                    <span className="text-xs text-amber-400 font-bold">★</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {supplierReviewsCount} {supplierReviewsCount === 1 ? 'reseña real' : 'reseñas reales'}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold group-hover:underline flex items-center gap-0.5">
                      Ver todas <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>

              {/* Out of Stock Alert Card */}
              <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl transition group ${
                outOfStockProducts.length > 0 
                  ? 'bg-gradient-to-b from-red-950/40 to-[#0a0f1d]/90 border-red-500/30 hover:border-red-500/50' 
                  : 'bg-gradient-to-b from-[#0e1628]/90 to-[#0a0f1d]/90 border-white/[0.08] hover:border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Productos Sin Stock</span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition group-hover:scale-110 ${
                    outOfStockProducts.length > 0 
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                      : 'bg-slate-800/60 text-slate-400 border-white/[0.08]'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className={`text-2xl sm:text-3xl font-black tracking-tight ${outOfStockProducts.length > 0 ? 'text-red-400' : 'text-white'}`}>
                    {outOfStockProducts.length}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    {outOfStockProducts.length > 0 ? 'Requieren reposición inmediata' : 'Catálogo 100% disponible'}
                  </p>
                </div>
              </div>

            </div>

        {/* SECTION 1: CRITICAL ALERT - PRODUCTOS SIN STOCK */}
        {outOfStockProducts.length > 0 && (
          <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Productos Agotados / Sin Stock</span>
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-red-500/30">
                      {outOfStockProducts.length} URGENTE
                    </span>
                  </h3>
                  <p className="text-xs text-red-200/80">
                    Estos productos están ocultos o sin capacidad de compra hasta que agregues existencias.
                  </p>
                </div>
              </div>

              <Link
                to="/proveedores/reportes/inventario"
                className="text-xs font-bold text-red-300 hover:text-white underline inline-flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Ver Reporte de Inventario</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {outOfStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#0e1424]/90 border border-red-500/20 hover:border-red-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow transition"
                >
                  <img
                    src={prod.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200'}
                    alt={prod.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku || 'N/A'}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      Stock: 0 uds
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingStockProduct(prod);
                      setNewStockValue(10);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition shrink-0"
                  >
                    Reponer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: PRODUCTOS QUE HAN HECHO VENTAS */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Rendimiento por Producto</h3>
                <p className="text-xs text-slate-400">
                  Desglose de demanda y facturación en USD y Bitcoin de tus artículos
                </p>
              </div>
            </div>

            <Link
              to="/proveedores/reportes/ventas"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition"
            >
              <span>Reporte Completo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {soldProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto mb-3 text-slate-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-300">Aún no se registran compras para tus productos</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Tan pronto los clientes liquiden con Bitcoin desde la tienda pública o el catálogo, sus órdenes aparecerán reflejadas aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.08] text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-center">Unidades Vendidas</th>
                    <th className="py-3 px-4 text-right">Recaudación (USD)</th>
                    <th className="py-3 px-4 text-right">Recaudación (BTC)</th>
                    <th className="py-3 px-4 text-center">Stock Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-medium">
                  {soldProducts.slice(0, 5).map((sp) => (
                    <tr key={sp.productId} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 text-white font-bold max-w-xs truncate">
                        {sp.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px] font-semibold text-slate-300 border border-white/[0.05]">
                          {sp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold text-[11px]">
                          {sp.unitsSold} uds
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                        ${sp.revenueUsd.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                        {sp.revenueBtc.toFixed(8)} ₿
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {sp.currentStock <= 0 ? (
                          <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 text-[10px]">
                            Agotado
                          </span>
                        ) : (
                          <span className="text-slate-300 font-semibold">{sp.currentStock} uds</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 3: RECENT SALES WITH VOUCHERS */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Ventas Recientes & Vouchers Oficiales</h3>
                <p className="text-xs text-slate-400">
                  Comprobantes criptográficos listos para auditar, imprimir o validar
                </p>
              </div>
            </div>

            <Link
              to="/proveedores/ventas"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition"
            >
              <span>Ver Todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto mb-3 text-slate-600">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-300">No hay ventas registradas aún</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Realiza una compra de prueba con Bitcoin desde la tienda landing para comprobar la emisión instantánea de vouchers.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] p-3 rounded-2xl transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-white/10">{order.order_number}</span>
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                        {order.voucher_code}
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                        Liquidado en BTC
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Cliente: <span className="text-white font-bold">{order.customer_name}</span> <span className="text-slate-500">({order.customer_email})</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Fecha: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">${Number(order.total_usd).toFixed(2)} USD</p>
                      <p className="text-xs font-mono text-amber-400 font-bold">{Number(order.total_btc).toFixed(8)} ₿</p>
                    </div>

                    {/* Button to view voucher */}
                    <button
                      onClick={() => handleOpenVoucher(order)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition active:scale-95"
                      title="Ver Comprobante Oficial de la Venta"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Ver Voucher</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}

      </div>

      {/* Quick Stock Update Modal */}
      {editingStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0e1628] border border-white/[0.1] rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
            <div>
              <h3 className="text-base font-black text-white">Reabastecer Producto</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{editingStockProduct.name}</p>
            </div>

            <form onSubmit={handleUpdateStockSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nueva Cantidad de Stock
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#060911] border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingStockProduct(null)}
                  className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStock}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isUpdatingStock ? 'Guardando...' : 'Guardar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      <VoucherModal
        order={selectedOrder}
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        title="Comprobante de Venta para Proveedor"
        isSupplierView={true}
      />
    </SupplierLayout>
  );
};
