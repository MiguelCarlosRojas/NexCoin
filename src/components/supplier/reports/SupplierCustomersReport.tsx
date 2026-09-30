import React, { useState, useEffect } from 'react';
import { SupplierLayout } from '../SupplierLayout';
import { useSupplier } from '../../../context/SupplierContext';
import { supabase } from '../../../lib/supabaseClient';
import { Order } from '../../../types/store';
import { VoucherModal } from '../../shared/VoucherModal';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { exportLandscapePdfTable } from '../../../lib/pdfReportGenerator';
import {
  Users,
  Search,
  Receipt,
  FileSpreadsheet,
  FileText,
  Filter
} from 'lucide-react';

interface CustomerSummary {
  email: string;
  name: string;
  wallet: string;
  totalOrders: number;
  totalSpentUsd: number;
  totalSpentBtc: number;
  lastOrderDate: string;
  lastVoucherCode: string;
  sampleOrder?: Order;
}

export const SupplierCustomersReport: React.FC = () => {
  const { supplier } = useSupplier();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') || searchParams.get('search') || '';
  const urlFiltro = (searchParams.get('filtro') || searchParams.get('filter') || 'all').toLowerCase();

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlQ);
  const [filterMode, setFilterMode] = useState<'all' | 'top_buyers' | 'frequent'>(() => {
    if (urlFiltro === 'top' || urlFiltro === 'top_buyers') return 'top_buyers';
    if (urlFiltro === 'frequent' || urlFiltro === 'frecuentes') return 'frequent';
    return 'all';
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);

  // Sync with URL params
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || '';
    const fParam = (searchParams.get('filtro') || searchParams.get('filter') || 'all').toLowerCase();

    if (qParam !== search) setSearch(qParam);
    if (fParam === 'top' || fParam === 'top_buyers') setFilterMode('top_buyers');
    else if (fParam === 'frequent' || fParam === 'frecuentes') setFilterMode('frequent');
    else setFilterMode('all');
  }, [searchParams]);

  const syncUrl = (newSearch: string, newFiltro: string) => {
    const params: Record<string, string> = {};
    if (newSearch.trim()) params.q = newSearch.trim();
    if (newFiltro && newFiltro !== 'all') params.filtro = newFiltro;
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    syncUrl(val, filterMode);
  };

  const handleFilterModeChange = (mode: 'all' | 'top_buyers' | 'frequent') => {
    setFilterMode(mode);
    syncUrl(search, mode);
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!supplier) return;
      setLoading(true);
      try {
        const { data: itemsData, error } = await supabase
          .from('order_items')
          .select('*, orders(*)')
          .eq('supplier_id', supplier.id);

        if (error) throw error;

        const custMap: { [email: string]: CustomerSummary } = {};

        if (itemsData) {
          itemsData.forEach((item: any) => {
            const ord = item.orders;
            if (!ord) return;

            const emailKey = (ord.customer_email || 'anonimo@nexcoin.com').toLowerCase();
            if (!custMap[emailKey]) {
              custMap[emailKey] = {
                email: emailKey,
                name: ord.customer_name || 'Cliente Web3',
                wallet: ord.customer_wallet || '',
                totalOrders: 0,
                totalSpentUsd: 0,
                totalSpentBtc: 0,
                lastOrderDate: ord.created_at,
                lastVoucherCode: ord.voucher_code,
                sampleOrder: ord,
              };
            }

            custMap[emailKey].totalOrders += 1;
            custMap[emailKey].totalSpentUsd += Number(item.total_usd);
            custMap[emailKey].totalSpentBtc += Number(item.total_btc);
          });
        }

        setCustomers(Object.values(custMap).sort((a, b) => b.totalSpentUsd - a.totalSpentUsd));
      } catch (err) {
        console.error('Error fetching customers report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [supplier]);

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.wallet.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filterMode === 'top_buyers') return c.totalSpentUsd >= 100;
    if (filterMode === 'frequent') return c.totalOrders > 1;

    return true;
  });

  const totalSpentAllUsd = filtered.reduce((acc, c) => acc + c.totalSpentUsd, 0);
  const totalSpentAllBtc = filtered.reduce((acc, c) => acc + c.totalSpentBtc, 0);
  const totalPurchases = filtered.reduce((acc, c) => acc + c.totalOrders, 0);

  // Export to Horizontal Landscape PDF with autoTable
  const handleExportPdf = () => {
    const headers = [
      'CLIENTE',
      'EMAIL',
      'WALLET BITCOIN / WEB3',
      'COMPRAS',
      'TOTAL USD',
      'TOTAL BTC',
      'ÚLTIMO VOUCHER',
      'ÚLTIMA ACTIVIDAD'
    ];

    const rows = filtered.map((c) => [
      c.name,
      c.email,
      c.wallet || 'N/A',
      c.totalOrders,
      `$${c.totalSpentUsd.toFixed(2)}`,
      `${c.totalSpentBtc.toFixed(8)} BTC`,
      c.lastVoucherCode || 'N/A',
      new Date(c.lastOrderDate).toLocaleDateString()
    ]);

    const footers = [
      [
        'TOTALES',
        `${filtered.length} Clientes Únicos`,
        '—',
        `${totalPurchases} órdenes`,
        `$${totalSpentAllUsd.toFixed(2)} USD`,
        `${totalSpentAllBtc.toFixed(8)} BTC`,
        '—',
        '—'
      ]
    ];

    exportLandscapePdfTable({
      title: 'Reporte Oficial de Clientes & Compradores Bitcoin',
      supplierName: supplier?.company_name || 'NexCoin Partner',
      stats: [
        { label: 'Clientes Únicos', value: `${filtered.length}` },
        { label: 'Gasto Total USD', value: `$${totalSpentAllUsd.toFixed(2)}` },
        { label: 'Gasto Total BTC', value: `${totalSpentAllBtc.toFixed(8)} BTC` },
        { label: 'Compras Totales', value: `${totalPurchases} órdenes` },
      ],
      headers,
      rows,
      footers,
      fileName: `Reporte_Clientes_NexCoin_${new Date().toISOString().slice(0, 10)}.pdf`,
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 32 },
        1: { cellWidth: 42 },
        2: { fontStyle: 'bold', cellWidth: 50 },
        3: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
        4: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 26 },
        5: { halign: 'right', textColor: [217, 119, 6], cellWidth: 32 },
        6: { halign: 'center', textColor: [217, 119, 6], cellWidth: 28 },
        7: { halign: 'center', cellWidth: 24 },
      }
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filtered.map((c) => ({
      Cliente: c.name,
      Email: c.email,
      'Wallet Bitcoin / Web3': c.wallet,
      'Total Compras': c.totalOrders,
      'Gasto Total USD': c.totalSpentUsd.toFixed(2),
      'Gasto Total BTC': c.totalSpentBtc.toFixed(8),
      'Último Voucher': c.lastVoucherCode,
      'Última Actividad': new Date(c.lastOrderDate).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    XLSX.writeFile(workbook, `Reporte_Clientes_NexCoin_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <SupplierLayout
      title="Reporte de Clientes & Compradores"
      subtitle="Directorio de clientes recurrentes, billeteras Web3 y comprobantes de compra"
    >
      <div className="space-y-6 w-full max-w-full">
        
        {/* Controls Bar */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-4 sm:p-5 rounded-2xl backdrop-blur-xl shadow-lg space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, email o dirección de wallet..."
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
                  disabled={filtered.length === 0}
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
                  disabled={filtered.length === 0}
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

          {/* Filter Pills */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              Segmento:
            </span>
            {[
              { id: 'all', label: 'Todos los Clientes' },
              { id: 'top_buyers', label: 'Top Compradores (>$100 USD)' },
              { id: 'frequent', label: 'Clientes Recurrentes (>1 compra)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => handleFilterModeChange(f.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                  filterMode === f.id
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#060911] text-slate-300 border border-white/[0.08] hover:border-amber-500/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Clientes Únicos</span>
            <p className="text-2xl font-black text-white mt-2 font-heading">{filtered.length}</p>
          </div>
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Compras Totales</span>
            <p className="text-2xl font-black text-cyan-400 mt-2 font-heading">{totalPurchases} órdenes</p>
          </div>
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Volumen Total (USD)</span>
            <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
              ${totalSpentAllUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Volumen Total (BTC)</span>
            <p className="text-2xl font-black font-mono text-amber-400 mt-2">
              {totalSpentAllBtc.toFixed(8)} ₿
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Directorio de Clientes Web3</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{filtered.length} compradores</span>
          </div>

          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Wallet Web3</th>
                    <th className="py-3 px-3 text-center">Compras</th>
                    <th className="py-3 px-3 text-right">Gasto USD</th>
                    <th className="py-3 px-3 text-right">Gasto BTC</th>
                    <th className="py-3 px-3 text-center">Último Voucher</th>
                    <th className="py-3 px-4">Última Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-3.5 bg-white/[0.06] rounded w-28" /></td>
                      <td className="py-4 px-3"><div className="h-3.5 bg-white/[0.06] rounded w-36" /></td>
                      <td className="py-4 px-3"><div className="h-3 bg-white/[0.04] rounded w-32" /></td>
                      <td className="py-4 px-3 text-center"><div className="h-5 bg-white/[0.06] rounded-full w-12 mx-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-white/[0.06] rounded w-16 ml-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-white/[0.06] rounded w-20 ml-auto" /></td>
                      <td className="py-4 px-3 text-center"><div className="h-4 bg-white/[0.06] rounded w-20 mx-auto" /></td>
                      <td className="py-4 px-4"><div className="h-3 bg-white/[0.04] rounded w-20" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-slate-500">No se encontraron clientes con los filtros actuales.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Wallet Web3</th>
                    <th className="py-3 px-3 text-center">Compras</th>
                    <th className="py-3 px-3 text-right">Gasto USD</th>
                    <th className="py-3 px-3 text-right">Gasto BTC</th>
                    <th className="py-3 px-3 text-center">Último Voucher</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-medium">
                  {filtered.map((c) => (
                    <tr key={c.email} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-bold text-white text-xs">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        {c.email}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                        {c.wallet || '—'}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-cyan-400">
                        {c.totalOrders}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-400 font-mono">
                        ${c.totalSpentUsd.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-amber-400">
                        {c.totalSpentBtc.toFixed(8)} ₿
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {c.lastVoucherCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {c.sampleOrder && (
                          <button
                            onClick={() => {
                              setSelectedOrder(c.sampleOrder || null);
                              setShowVoucher(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Voucher</span>
                          </button>
                        )}
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
        title="Voucher Oficial del Cliente"
        isSupplierView={true}
      />
    </SupplierLayout>
  );
};
