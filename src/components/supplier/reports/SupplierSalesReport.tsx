import React, { useState, useEffect, useMemo } from 'react';
import { SupplierLayout } from '../SupplierLayout';
import { useSupplier } from '../../../context/SupplierContext';
import { supabase } from '../../../lib/supabaseClient';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { exportLandscapePdfTable } from '../../../lib/pdfReportGenerator';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  FileText,
  Search
} from 'lucide-react';

export const SupplierSalesReport: React.FC = () => {
  const { supplier } = useSupplier();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') || searchParams.get('search') || '';
  const urlFiltro = (searchParams.get('filtro') || searchParams.get('filter') || 'all').toLowerCase();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlQ);
  const [dateRange, setDateRange] = useState<'all' | '30d' | '7d'>(() => {
    if (urlFiltro === '7d' || urlFiltro === 'semana') return '7d';
    if (urlFiltro === '30d' || urlFiltro === 'mes') return '30d';
    return 'all';
  });

  // Sync state with URL params
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || '';
    const fParam = (searchParams.get('filtro') || searchParams.get('filter') || 'all').toLowerCase();

    if (qParam !== search) setSearch(qParam);
    if (fParam === '7d' || fParam === 'semana') setDateRange('7d');
    else if (fParam === '30d' || fParam === 'mes') setDateRange('30d');
    else setDateRange('all');
  }, [searchParams]);

  const syncUrl = (newSearch: string, newFiltro: string) => {
    const params: Record<string, string> = {};
    if (newSearch.trim()) params.q = newSearch.trim();
    if (newFiltro && newFiltro !== 'all') params.filtro = newFiltro;
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    syncUrl(val, dateRange);
  };

  const handleDateRangeChange = (r: 'all' | '30d' | '7d') => {
    setDateRange(r);
    syncUrl(search, r);
  };

  useEffect(() => {
    const fetchSales = async () => {
      if (!supplier) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select('*, orders(*)')
          .eq('supplier_id', supplier.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error('Error fetching sales report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [supplier]);

  const filteredItems = items.filter((item) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (item.product_name && item.product_name.toLowerCase().includes(term)) ||
      (item.orders?.order_number && item.orders.order_number.toLowerCase().includes(term)) ||
      (item.orders?.voucher_code && item.orders.voucher_code.toLowerCase().includes(term)) ||
      (item.orders?.customer_name && item.orders.customer_name.toLowerCase().includes(term)) ||
      (item.orders?.customer_email && item.orders.customer_email.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (dateRange === 'all') return true;
    const itemDate = new Date(item.created_at).getTime();
    const now = Date.now();
    const days = dateRange === '7d' ? 7 : 30;
    return now - itemDate <= days * 24 * 60 * 60 * 1000;
  });

  const totalRevenueUsd = filteredItems.reduce((acc, cur) => acc + Number(cur.total_usd), 0);
  const totalRevenueBtc = filteredItems.reduce((acc, cur) => acc + Number(cur.total_btc), 0);
  const totalUnits = filteredItems.reduce((acc, cur) => acc + Number(cur.quantity), 0);
  const averageTicket = filteredItems.length > 0 ? totalRevenueUsd / filteredItems.length : 0;

  // Paginación: 10 registros por página
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateRange]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Export to Horizontal Landscape PDF with autoTable
  const handleExportPdf = () => {
    const headers = [
      'N° ORDEN',
      'VOUCHER',
      'CLIENTE',
      'PRODUCTO / ARTÍCULO',
      'CANT.',
      'P. UNIT (USD)',
      'TOTAL USD',
      'TOTAL BTC',
      'FECHA'
    ];

    const rows = filteredItems.map((item) => [
      item.orders?.order_number || 'N/A',
      item.orders?.voucher_code || 'N/A',
      item.orders?.customer_name || 'Anónimo',
      item.product_name,
      item.quantity,
      `$${Number(item.unit_price_usd).toFixed(2)}`,
      `$${Number(item.total_usd).toFixed(2)}`,
      `${Number(item.total_btc).toFixed(8)} BTC`,
      new Date(item.created_at).toLocaleDateString()
    ]);

    const footers = [
      [
        'TOTALES',
        '—',
        '—',
        `${filteredItems.length} transacciones`,
        `${totalUnits} uds`,
        '—',
        `$${totalRevenueUsd.toFixed(2)} USD`,
        `${totalRevenueBtc.toFixed(8)} BTC`,
        '—'
      ]
    ];

    exportLandscapePdfTable({
      title: 'Reporte Oficial de Ventas & Facturación Bitcoin',
      supplierName: supplier?.company_name || 'NovaSats Partner',
      stats: [
        { label: 'Facturación USD', value: `$${totalRevenueUsd.toFixed(2)}` },
        { label: 'Facturación BTC', value: `${totalRevenueBtc.toFixed(8)} BTC` },
        { label: 'Unidades Vendidas', value: `${totalUnits} uds.` },
        { label: 'Ticket Promedio', value: `$${averageTicket.toFixed(2)} USD` },
      ],
      headers,
      rows,
      footers,
      fileName: `Reporte_Ventas_Facturacion_${new Date().toISOString().slice(0, 10)}.pdf`,
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { textColor: [217, 119, 6], cellWidth: 28 },
        2: { cellWidth: 32 },
        3: { cellWidth: 'auto' },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
        5: { halign: 'right', cellWidth: 24 },
        6: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 24 },
        7: { halign: 'right', textColor: [217, 119, 6], cellWidth: 30 },
        8: { halign: 'center', cellWidth: 22 },
      }
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredItems.map((item) => ({
      'ID Venta': item.id,
      'Orden': item.orders?.order_number || 'N/A',
      'Voucher': item.orders?.voucher_code || 'N/A',
      'Cliente': item.orders?.customer_name || 'N/A',
      'Email Cliente': item.orders?.customer_email || 'N/A',
      'Wallet Cliente': item.orders?.customer_wallet || 'N/A',
      'Producto': item.product_name,
      'Cantidad': item.quantity,
      'Precio Unit USD': Number(item.unit_price_usd).toFixed(2),
      'Total USD': Number(item.total_usd).toFixed(2),
      'Total BTC': Number(item.total_btc).toFixed(8),
      'Hash TX': item.orders?.payment_tx_hash || 'N/A',
      'Fecha': new Date(item.created_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Ventas');
    XLSX.writeFile(workbook, `Reporte_Ventas_NovaSats_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <SupplierLayout
      title="Reporte de Ventas & Facturación"
      subtitle="Auditoría comercial de transacciones, liquidaciones Bitcoin y exportación de datos"
    >
      <div className="space-y-6 w-full max-w-full">
        
        {/* Controls Bar */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-4 sm:p-5 rounded-2xl backdrop-blur-xl shadow-lg space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por orden, voucher, producto o cliente..."
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
                  disabled={filteredItems.length === 0}
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
                  disabled={filteredItems.length === 0}
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

          {/* Date range filter */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Período:
            </span>
            {(['all', '30d', '7d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleDateRangeChange(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                  dateRange === r
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#060911] text-slate-300 border border-white/[0.08] hover:border-amber-500/40'
                }`}
              >
                {r === 'all' ? 'Histórico Completo' : r === '30d' ? 'Últimos 30 días' : 'Últimos 7 días'}
              </button>
            ))}
          </div>

        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Facturación USD</span>
            <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">${totalRevenueUsd.toFixed(2)}</p>
          </div>
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Facturación BTC</span>
            <p className="text-2xl font-black font-mono text-amber-400 mt-2">{totalRevenueBtc.toFixed(8)} ₿</p>
          </div>
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Unidades Despachadas</span>
            <p className="text-2xl font-black text-white mt-2 font-heading">{totalUnits} uds.</p>
          </div>
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Ticket Promedio</span>
            <p className="text-2xl font-black text-cyan-400 mt-2 font-mono">${averageTicket.toFixed(2)}</p>
          </div>
        </div>

        {/* Detailed Sales Items Table */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>Registro Detallado de Ventas</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{filteredItems.length} transacciones</span>
          </div>

          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3.5 px-4">Orden / Voucher</th>
                    <th className="py-3.5 px-3">Producto Vendido</th>
                    <th className="py-3.5 px-3 text-center">Cant.</th>
                    <th className="py-3.5 px-3 text-right">Total USD</th>
                    <th className="py-3.5 px-3 text-right">Total BTC</th>
                    <th className="py-3.5 px-3">Cliente</th>
                    <th className="py-3.5 px-4">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-3.5 bg-white/[0.06] rounded w-24" /></td>
                      <td className="py-4 px-3"><div className="h-3.5 bg-white/[0.06] rounded w-40" /></td>
                      <td className="py-4 px-3 text-center"><div className="h-3.5 bg-white/[0.06] rounded w-8 mx-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-white/[0.06] rounded w-16 ml-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-white/[0.06] rounded w-20 ml-auto" /></td>
                      <td className="py-4 px-3"><div className="h-3.5 bg-white/[0.06] rounded w-24" /></td>
                      <td className="py-4 px-4"><div className="h-3 bg-white/[0.04] rounded w-20" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-16 text-center text-slate-500">No hay ventas registradas con los filtros actuales.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">Orden / Voucher</th>
                    <th className="py-3 px-3">Producto</th>
                    <th className="py-3 px-3 text-center">Cantidad</th>
                    <th className="py-3 px-3 text-right">P. Unit USD</th>
                    <th className="py-3 px-3 text-right">Total USD</th>
                    <th className="py-3 px-3 text-right">Total BTC</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-medium">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {item.orders?.order_number || '—'}
                        <div className="text-[10px] text-amber-400 font-normal">{item.orders?.voucher_code}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-semibold max-w-xs truncate">
                        {item.product_name}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-cyan-400">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300 font-mono">
                        ${Number(item.unit_price_usd).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400 font-mono">
                        ${Number(item.total_usd).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-400">
                        {Number(item.total_btc).toFixed(8)} ₿
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[130px]">
                        {item.orders?.customer_name || 'Anónimo'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación (10 registros por página) */}
            {filteredItems.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0a0f1d]/90 border border-white/[0.08] text-xs text-slate-400 mt-5">
                <div>
                  Mostrando <span className="text-white font-bold">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredItems.length)}</span> - <span className="text-white font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</span> de <span className="text-white font-bold">{filteredItems.length}</span> ventas (10 por página)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.1] hover:border-amber-500/50 text-white disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
                  >
                    Anterior
                  </button>
                  <span className="font-mono text-xs px-2">
                    Página <strong className="text-amber-400">{currentPage}</strong> de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.1] hover:border-amber-500/50 text-white disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
          )}
        </div>

      </div>
    </SupplierLayout>
  );
};
