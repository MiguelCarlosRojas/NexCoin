import React, { useState, useEffect } from 'react';
import { SupplierLayout } from './SupplierLayout';
import { useSupplier } from '../../context/SupplierContext';
import { supabase } from '../../lib/supabaseClient';
import { Order } from '../../types/store';
import { VoucherModal } from '../shared/VoucherModal';
import {
  Receipt,
  Search
} from 'lucide-react';

export const SupplierOrders: React.FC = () => {
  const { supplier } = useSupplier();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);

  const fetchOrders = async () => {
    if (!supplier) return;
    setLoading(true);
    try {
      // Fetch order items belonging to this supplier
      const { data: itemsData, error: itemsErr } = await supabase
        .from('order_items')
        .select('*, orders(*)')
        .eq('supplier_id', supplier.id);

      if (itemsErr) throw itemsErr;

      // Group by order
      const ordersMap: { [orderId: string]: Order } = {};
      if (itemsData && itemsData.length > 0) {
        itemsData.forEach((item: any) => {
          if (item.orders) {
            if (!ordersMap[item.orders.id]) {
              ordersMap[item.orders.id] = {
                ...item.orders,
                items: [],
              };
            }
            ordersMap[item.orders.id].items?.push(item);
          }
        });
      }

      const list = Object.values(ordersMap).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(list);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [supplier]);

  const handleOpenVoucher = (order: Order) => {
    setSelectedOrder(order);
    setShowVoucher(true);
  };

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(term) ||
      o.voucher_code.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.customer_email.toLowerCase().includes(term) ||
      o.payment_tx_hash?.toLowerCase().includes(term)
    );
  });

  const totalUsd = filteredOrders.reduce((sum, o) => sum + Number(o.total_usd), 0);
  const totalBtc = filteredOrders.reduce((sum, o) => sum + Number(o.total_btc), 0);

  return (
    <SupplierLayout
      title="Ventas Realizadas & Vouchers"
      subtitle="Consulta los pedidos liquidados con Bitcoin y genera los comprobantes oficiales"
    >
      <div className="space-y-6 w-full max-w-full">
        
        {/* Stats and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1d]/90 border border-white/[0.08] p-4 sm:p-5 rounded-2xl backdrop-blur-xl shadow-lg">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por orden, voucher, cliente o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
            <div className="bg-[#060911] px-3.5 py-2 rounded-xl border border-white/[0.08] flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Total USD:</span>
              <span className="text-emerald-400 font-bold">${totalUsd.toFixed(2)}</span>
            </div>
            <div className="bg-[#060911] px-3.5 py-2 rounded-xl border border-white/[0.08] flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Total BTC:</span>
              <span className="text-amber-400 font-mono font-bold">{totalBtc.toFixed(8)} ₿</span>
            </div>
          </div>

        </div>

        {/* Orders Table */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
          {loading ? (
            <div className="p-16 text-center text-slate-400 animate-pulse font-medium">Cargando ventas y vouchers...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto mb-3 text-slate-600">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-300">No se encontraron ventas</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Las órdenes de clientes con comprobante oficial aparecerán aquí automáticamente una vez confirmadas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3.5 px-4">Orden / Voucher</th>
                    <th className="py-3.5 px-3">Cliente</th>
                    <th className="py-3.5 px-3">Artículos Comprados</th>
                    <th className="py-3.5 px-3 text-right">Total USD</th>
                    <th className="py-3.5 px-3 text-right">Total BTC</th>
                    <th className="py-3.5 px-3">Fecha</th>
                    <th className="py-3.5 px-4 text-right">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-medium">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition">
                      
                      {/* Order and Voucher */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white text-xs">{order.order_number}</div>
                        <span className="inline-block mt-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                          {order.voucher_code}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">{order.customer_name}</div>
                        <div className="text-[11px] text-slate-400">{order.customer_email}</div>
                        <div className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                          {order.customer_wallet}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-3 max-w-xs">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-0.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-slate-300 truncate text-[11px]">
                                <span className="font-bold text-amber-400">{item.quantity}x</span> {item.product_name}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Total USD */}
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-400">
                        ${Number(order.total_usd).toFixed(2)}
                      </td>

                      {/* Total BTC */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-400">
                        {Number(order.total_btc).toFixed(8)} ₿
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        {new Date(order.created_at).toLocaleDateString()}<br />
                        <span className="text-[10px] text-slate-500">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Voucher Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenVoucher(order)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-[11px] shadow-sm shadow-blue-600/20 transition active:scale-95"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Ver Voucher</span>
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Voucher Modal */}
      <VoucherModal
        order={selectedOrder}
        isOpen={showVoucher}
        onClose={() => setShowVoucher(false)}
        title="Voucher Oficial de Venta"
        isSupplierView={true}
      />
    </SupplierLayout>
  );
};
