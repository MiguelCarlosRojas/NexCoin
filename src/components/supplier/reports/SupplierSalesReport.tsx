import React, { useState, useEffect } from 'react';
import { SupplierLayout } from '../SupplierLayout';
import { useSupplier } from '../../../context/SupplierContext';
import { supabase } from '../../../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

export const SupplierSalesReport: React.FC = () => {
  const { supplier } = useSupplier();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | '30d' | '7d'>('all');

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
    XLSX.writeFile(workbook, `Reporte_Ventas_NexCoin_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`Reporte Oficial de Ventas - ${supplier?.company_name || 'NexCoin'}`, 14, 18);
    doc.setFontSize(9);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 25);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(`Ingresos Totales: $${totalRevenueUsd.toFixed(2)} USD (${totalRevenueBtc.toFixed(8)} BTC)`, 14, 40);
    doc.text(`Unidades Vendidas: ${totalUnits} | Ticket Promedio: $${averageTicket.toFixed(2)} USD`, 14, 47);

    let y = 60;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    filteredItems.slice(0, 25).forEach((item, idx) => {
      doc.text(
        `${idx + 1}. [${item.orders?.order_number || 'ORD'}] ${item.product_name.substring(0, 30)} - ${item.quantity} uds - $${Number(item.total_usd).toFixed(2)} USD`,
        14,
        y
      );
      y += 7;
    });

    doc.save(`Reporte_Ventas_NexCoin.pdf`);
  };

  return (
    <SupplierLayout
      title="Reporte de Ventas & Facturación"
      subtitle="Auditoría comercial de transacciones, liquidaciones Bitcoin y exportación de datos"
    >
      <div className="space-y-6">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          
          {/* Date range filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Período:
            </span>
            {(['all', '30d', '7d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  dateRange === r
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {r === 'all' ? 'Histórico Completo' : r === '30d' ? 'Últimos 30 días' : 'Últimos 7 días'}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition"
            >
              <FileText className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>

        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Facturación USD</span>
            <p className="text-2xl font-black text-emerald-400 mt-2">${totalRevenueUsd.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Facturación BTC</span>
            <p className="text-2xl font-black font-mono text-amber-400 mt-2">{totalRevenueBtc.toFixed(8)} ₿</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Unidades Despachadas</span>
            <p className="text-2xl font-black text-white mt-2">{totalUnits} uds.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Ticket Promedio</span>
            <p className="text-2xl font-black text-blue-400 mt-2">${averageTicket.toFixed(2)}</p>
          </div>
        </div>

        {/* Detailed Sales Items Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>Registro Detallado de Ventas</span>
            </h3>
            <span className="text-xs text-slate-500">{filteredItems.length} transacciones registradas</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400 animate-pulse">Cargando reporte de ventas...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No hay ventas registradas para este período.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
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
                <tbody className="divide-y divide-slate-800 font-medium">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {item.orders?.order_number || '—'}
                        <div className="text-[10px] text-amber-400 font-normal">{item.orders?.voucher_code}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-semibold max-w-xs truncate">
                        {item.product_name}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-400">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        ${Number(item.unit_price_usd).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
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
          )}
        </div>

      </div>
    </SupplierLayout>
  );
};
