import React, { useState, useEffect } from 'react';
import { SupplierLayout } from './SupplierLayout';
import { useSupplier } from '../../context/SupplierContext';
import { supabase } from '../../lib/supabaseClient';
import { Order } from '../../types/store';
import { VoucherModal } from '../shared/VoucherModal';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { exportLandscapePdfTable } from '../../lib/pdfReportGenerator';
import {
  Receipt,
  Search,
  FileText,
  FileSpreadsheet,
  Filter
} from 'lucide-react';

export const SupplierOrders: React.FC = () => {
  const { supplier } = useSupplier();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') || searchParams.get('search') || '';
  const urlFiltro = (searchParams.get('filtro') || searchParams.get('filter') || 'todos').toLowerCase();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlQ);
  const [dateFilter, setDateFilter] = useState<'todos' | 'hoy' | 'semana' | 'mes'>(() => {
    if (urlFiltro === 'hoy' || urlFiltro === 'today') return 'hoy';
    if (urlFiltro === 'semana' || urlFiltro === '7d') return 'semana';
    if (urlFiltro === 'mes' || urlFiltro === '30d') return 'mes';
    return 'todos';
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);

  // Sync state with URL params changes
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || '';
    const fParam = (searchParams.get('filtro') || searchParams.get('filter') || 'todos').toLowerCase();

    if (qParam !== search) setSearch(qParam);
    if (fParam === 'hoy' || fParam === 'today') setDateFilter('hoy');
    else if (fParam === 'semana' || fParam === '7d') setDateFilter('semana');
    else if (fParam === 'mes' || fParam === '30d') setDateFilter('mes');
    else setDateFilter('todos');
  }, [searchParams]);

  const syncUrl = (newSearch: string, newFiltro: string) => {
    const params: Record<string, string> = {};
    if (newSearch.trim()) params.q = newSearch.trim();
    if (newFiltro && newFiltro !== 'todos') params.filtro = newFiltro;
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    syncUrl(val, dateFilter);
  };

  const handleFilterChange = (filter: 'todos' | 'hoy' | 'semana' | 'mes') => {
    setDateFilter(filter);
    syncUrl(search, filter);
  };

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
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      o.order_number.toLowerCase().includes(term) ||
      o.voucher_code.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.customer_email.toLowerCase().includes(term) ||
      (o.payment_tx_hash && o.payment_tx_hash.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (dateFilter === 'todos') return true;

    const orderTime = new Date(o.created_at).getTime();
    const now = Date.now();
    if (dateFilter === 'hoy') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return orderTime >= today.getTime();
    }
    if (dateFilter === 'semana') {
      return now - orderTime <= 7 * 24 * 60 * 60 * 1000;
    }
    if (dateFilter === 'mes') {
      return now - orderTime <= 30 * 24 * 60 * 60 * 1000;
    }

    return true;
  });

  const totalUsd = filteredOrders.reduce((sum, o) => sum + Number(o.total_usd), 0);
  const totalBtc = filteredOrders.reduce((sum, o) => sum + Number(o.total_btc), 0);
  const averageTicket = filteredOrders.length > 0 ? totalUsd / filteredOrders.length : 0;

  // Export to Horizontal Landscape PDF with autoTable
  const handleExportPdf = () => {
    const headers = [
      'N° ORDEN',
      'CÓD. VOUCHER',
      'CLIENTE',
      'EMAIL',
      'PRODUCTOS / ARTÍCULOS',
      'TOTAL USD',
      'TOTAL BTC',
      'FECHA / HORA'
    ];

    const rows = filteredOrders.map((o) => {
      const itemsStr = (o.items || [])
        .map((it) => `${it.quantity}x ${it.product_name}`)
        .join(', ');

      return [
        o.order_number,
        o.voucher_code,
        o.customer_name,
        o.customer_email,
        itemsStr || '—',
        `$${Number(o.total_usd).toFixed(2)}`,
        `${Number(o.total_btc).toFixed(8)} BTC`,
        new Date(o.created_at).toLocaleString()
      ];
    });

    const footers = [
      [
        'TOTALES',
        `${filteredOrders.length} Órdenes`,
        '—',
        '—',
        '—',
        `$${totalUsd.toFixed(2)} USD`,
        `${totalBtc.toFixed(8)} BTC`,
        '—'
      ]
    ];

    exportLandscapePdfTable({
      title: 'Reporte Oficial de Ventas & Vouchers Bitcoin',
      supplierName: supplier?.company_name || 'NovaSats Partner',
      stats: [
        { label: 'Total Órdenes', value: `${filteredOrders.length}` },
        { label: 'Total Recaudado (USD)', value: `$${totalUsd.toFixed(2)}` },
        { label: 'Total Recaudado (BTC)', value: `${totalBtc.toFixed(8)} BTC` },
        { label: 'Ticket Promedio', value: `$${averageTicket.toFixed(2)} USD` },
      ],
      headers,
      rows,
      footers,
      fileName: `Reporte_Ventas_Vouchers_${new Date().toISOString().slice(0, 10)}.pdf`,
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { textColor: [217, 119, 6], cellWidth: 28 },
        2: { fontStyle: 'bold', cellWidth: 32 },
        3: { cellWidth: 42 },
        4: { cellWidth: 'auto' },
        5: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 24 },
        6: { halign: 'right', textColor: [217, 119, 6], cellWidth: 30 },
        7: { halign: 'center', cellWidth: 32 },
      }
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredOrders.map((o) => ({
      'N° Orden': o.order_number,
      'Código Voucher': o.voucher_code,
      'Cliente': o.customer_name,
      'Email Cliente': o.customer_email,
      'Wallet Cliente': o.customer_wallet,
      'Artículos': (o.items || []).map((i) => `${i.quantity}x ${i.product_name}`).join(' | '),
      'Total USD': Number(o.total_usd).toFixed(2),
      'Total BTC': Number(o.total_btc).toFixed(8),
      'Tx Hash': o.payment_tx_hash || 'N/A',
      'Fecha': new Date(o.created_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas & Vouchers');
    XLSX.writeFile(workbook, `Ventas_Vouchers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <SupplierLayout
      title="Ventas Realizadas & Vouchers"
      subtitle="Consulta los pedidos liquidados con Bitcoin y genera los comprobantes oficiales"
    >
      <div className="space-y-6 w-full max-w-full">
        
        {/* Stats, Filter Pills and Search Bar */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-4 sm:p-5 rounded-2xl backdrop-blur-xl shadow-lg space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por orden, voucher, cliente o email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
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

            {/* Action Buttons: Compact PDF & Excel with Tooltip */}
            <div className="flex items-center gap-2">
              
              {/* PDF Icon Button */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={filteredOrders.length === 0}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-red-600/20 transition active:scale-95"
                  aria-label="Exportar PDF"
                  title="Exportar PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 border border-white/[0.1] text-white text-[10px] font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-30">
                  Exportar PDF
                </div>
              </div>

              {/* Excel Icon Button */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={filteredOrders.length === 0}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 transition active:scale-95"
                  aria-label="Exportar Excel"
                  title="Exportar Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 border border-white/[0.1] text-white text-[10px] font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-30">
                  Exportar Excel
                </div>
              </div>

            </div>

          </div>

          {/* Filter Pills and Summary Chips */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
            
            {/* Filter mode pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-500" />
                Período:
              </span>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'hoy', label: 'Hoy' },
                { id: 'semana', label: 'Últimos 7 días' },
                { id: 'mes', label: 'Últimos 30 días' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFilterChange(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    dateFilter === f.id
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-[#060911] text-slate-300 border border-white/[0.08] hover:border-amber-500/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick Totals */}
            <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
              <div className="bg-[#060911] px-3 py-1.5 rounded-xl border border-white/[0.08] flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total USD:</span>
                <span className="text-emerald-400 font-bold font-mono">${totalUsd.toFixed(2)}</span>
              </div>
              <div className="bg-[#060911] px-3 py-1.5 rounded-xl border border-white/[0.08] flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total BTC:</span>
                <span className="text-amber-400 font-mono font-bold">{totalBtc.toFixed(8)} ₿</span>
              </div>
            </div>

          </div>

        </div>

        {/* Orders Table */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
          {loading ? (
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
                <tbody className="divide-y divide-white/[0.04]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-white/[0.06] rounded w-28" />
                          <div className="h-2.5 bg-white/[0.04] rounded w-20" />
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-white/[0.06] rounded w-24" />
                          <div className="h-2.5 bg-white/[0.04] rounded w-32" />
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="h-3.5 bg-white/[0.06] rounded w-40" />
                      </td>
                      <td className="py-4 px-3 text-right">
                        <div className="h-4 bg-white/[0.06] rounded w-16 ml-auto" />
                      </td>
                      <td className="py-4 px-3 text-right">
                        <div className="h-4 bg-white/[0.06] rounded w-20 ml-auto" />
                      </td>
                      <td className="py-4 px-3">
                        <div className="h-3 bg-white/[0.04] rounded w-20" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-7 bg-white/[0.06] rounded-xl w-24 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto mb-3 text-slate-600">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-300">No se encontraron ventas con los filtros actuales</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Prueba cambiando los términos de búsqueda o el rango de fecha.
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
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-400 font-mono">
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
