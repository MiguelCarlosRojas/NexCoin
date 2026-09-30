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
  ArrowUpRight
} from 'lucide-react';

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
      subtitle={`Bienvenido al panel de control de ${supplier?.company_name || 'Proveedor'}`}
    >
      <div className="space-y-8 w-full max-w-full">
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Revenue USD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos Totales (USD)</span>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-white">
                ${totalRevenueUsd.toFixed(2)}
              </p>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Liquidado en Bitcoin</span>
              </p>
            </div>
          </div>

          {/* Revenue BTC */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recaudación en Bitcoin</span>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Bitcoin className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black font-mono text-amber-400">
                {totalRevenueBtc.toFixed(8)} ₿
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Pagos verificados on-chain
              </p>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pedidos / Ventas</span>
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-white">{orders.length}</p>
              <p className="text-xs text-blue-400 mt-1 font-semibold">
                Vouchers emitidos a clientes
              </p>
            </div>
          </div>

          {/* Out of Stock Alert Card */}
          <div className={`border rounded-2xl p-5 shadow-lg relative overflow-hidden ${
            outOfStockProducts.length > 0 
              ? 'bg-red-950/20 border-red-500/40' 
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productos Sin Stock</span>
              <div className={`p-2.5 rounded-xl border ${
                outOfStockProducts.length > 0 
                  ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-2xl font-black ${outOfStockProducts.length > 0 ? 'text-red-400' : 'text-white'}`}>
                {outOfStockProducts.length}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {outOfStockProducts.length > 0 ? 'Requieren reposición urgente' : 'Inventario 100% abastecido'}
              </p>
            </div>
          </div>

        </div>

        {/* SECTION 1: CRITICAL ALERT - PRODUCTOS SIN STOCK */}
        {outOfStockProducts.length > 0 && (
          <div className="bg-red-950/30 border border-red-500/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/40">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Productos Agotados / Sin Stock ({outOfStockProducts.length})</span>
                    <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Atención Requerida
                    </span>
                  </h3>
                  <p className="text-xs text-red-300">
                    Estos productos no pueden ser comprados en la tienda hasta que actualices su inventario.
                  </p>
                </div>
              </div>

              <Link
                to="/proveedores/reportes/inventario"
                className="text-xs font-bold text-red-300 hover:text-white underline inline-flex items-center gap-1"
              >
                <span>Ver Reporte de Inventario</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {outOfStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-slate-900/90 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow"
                >
                  <img
                    src={prod.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200'}
                    alt={prod.name}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">SKU: {prod.sku || 'N/A'}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      Stock: 0 unidades
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingStockProduct(prod);
                      setNewStockValue(10);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition shrink-0"
                  >
                    Recargar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: PRODUCTOS QUE HAN HECHO VENTAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Productos que han hecho Ventas</h3>
                <p className="text-xs text-slate-400">
                  Desglose de productos con demanda comercial y unidades vendidas en la tienda
                </p>
              </div>
            </div>

            <Link
              to="/proveedores/reportes/ventas"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
            >
              <span>Reporte Completo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {soldProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">Aún no se registran ventas para tus productos</p>
              <p className="text-xs text-slate-500 mt-1">
                Cuando los clientes paguen con Bitcoin desde la tienda landing, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 px-3">Producto</th>
                    <th className="pb-3 px-3">Categoría</th>
                    <th className="pb-3 px-3 text-center">Unidades Vendidas</th>
                    <th className="pb-3 px-3 text-right">Recaudación (USD)</th>
                    <th className="pb-3 px-3 text-right">Recaudación (BTC)</th>
                    <th className="pb-3 px-3 text-center">Stock Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {soldProducts.map((sp) => (
                    <tr key={sp.productId} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-3 text-white font-bold max-w-xs truncate">
                        {sp.name}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{sp.category}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full font-bold">
                          {sp.unitsSold} uds.
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                        ${sp.revenueUsd.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-400">
                        {sp.revenueBtc.toFixed(8)} ₿
                      </td>
                      <td className="py-3 px-3 text-center">
                        {sp.currentStock <= 0 ? (
                          <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded">
                            0 (Agotado)
                          </span>
                        ) : (
                          <span className="text-slate-300 font-semibold">{sp.currentStock} uds.</span>
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
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ventas Realizadas & Vouchers del Proveedor</h3>
                <p className="text-xs text-slate-400">
                  Accede al comprobante oficial de cada venta para imprimir, auditar o reenviar por Gmail
                </p>
              </div>
            </div>

            <Link
              to="/proveedores/ventas"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              <span>Ver Todas las Ventas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No hay ventas registradas aún</p>
              <p className="text-xs text-slate-500 mt-1">
                Puedes realizar una compra de prueba desde la tienda landing para ver el voucher en vivo.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-850/40 p-3 rounded-2xl transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">{order.order_number}</span>
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                        {order.voucher_code}
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                        Pago Bitcoin
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Cliente: <span className="text-slate-200 font-semibold">{order.customer_name}</span> ({order.customer_email})
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Fecha: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">${Number(order.total_usd).toFixed(2)} USD</p>
                      <p className="text-xs font-mono text-amber-400">{Number(order.total_btc).toFixed(8)} ₿</p>
                    </div>

                    {/* Button to view voucher */}
                    <button
                      onClick={() => handleOpenVoucher(order)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition"
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

      </div>

      {/* Quick Stock Update Modal */}
      {editingStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Reabastecer Producto</h3>
            <p className="text-xs text-slate-400">{editingStockProduct.name}</p>

            <form onSubmit={handleUpdateStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nueva Cantidad de Stock
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStockProduct(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStock}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl"
                >
                  {isUpdatingStock ? 'Actualizando...' : 'Guardar Stock'}
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
