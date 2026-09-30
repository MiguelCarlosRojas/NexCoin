import React, { useState, useEffect } from 'react';
import { SupplierLayout } from '../SupplierLayout';
import { useSupplier } from '../../../context/SupplierContext';
import { supabase } from '../../../lib/supabaseClient';
import { Order } from '../../../types/store';
import { VoucherModal } from '../../shared/VoucherModal';
import * as XLSX from 'xlsx';
import {
  Users,
  Search,
  Receipt,
  Mail,
  FileSpreadsheet
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
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);

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

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.wallet.toLowerCase().includes(search.toLowerCase())
  );

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
      title="Reporte de Clientes & Wallets Web3"
      subtitle="Base de datos de compradores, billeteras verificadas y comprobantes asociados"
    >
      <div className="space-y-6">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre, email o wallet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Clientes Excel</span>
          </button>

        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Directorio de Compradores</span>
            </h3>
            <span className="text-xs text-slate-500">{filtered.length} clientes registrados</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400 animate-pulse">Cargando datos de clientes...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No se encontraron clientes registrados aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-3">Billetera Bitcoin / Web3</th>
                    <th className="py-3 px-3 text-center">Compras</th>
                    <th className="py-3 px-3 text-right">Total USD</th>
                    <th className="py-3 px-3 text-right">Total BTC</th>
                    <th className="py-3 px-3">Último Voucher</th>
                    <th className="py-3 px-4 text-right">Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {filtered.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{c.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-blue-400 max-w-xs truncate">
                        {c.wallet || '—'}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-white">
                        {c.totalOrders}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        ${c.totalSpentUsd.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-amber-400">
                        {c.totalSpentBtc.toFixed(8)} ₿
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-amber-300">
                        {c.lastVoucherCode}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {c.sampleOrder && (
                          <button
                            onClick={() => {
                              setSelectedOrder(c.sampleOrder || null);
                              setShowVoucher(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Ver</span>
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
        title="Voucher del Cliente"
        isSupplierView={true}
      />
    </SupplierLayout>
  );
};
