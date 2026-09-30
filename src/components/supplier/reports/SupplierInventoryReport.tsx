import React, { useState, useEffect } from 'react';
import { SupplierLayout } from '../SupplierLayout';
import { useSupplier } from '../../../context/SupplierContext';
import { supabase } from '../../../lib/supabaseClient';
import { Product } from '../../../types/store';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  Boxes,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupplierInventoryReport: React.FC = () => {
  const { supplier } = useSupplier();
  const [products, setProducts] = useState<Product[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!supplier) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('supplier_id', supplier.id)
          .order('stock', { ascending: true }); // Show out of stock first!

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching inventory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [supplier]);

  const outOfStockList = products.filter((p) => p.stock <= 0);
  const lowStockList = products.filter((p) => p.stock > 0 && p.stock <= 3);

  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryValueUsd = products.reduce((acc, p) => acc + Number(p.price_usd) * (p.stock || 0), 0);
  const totalInventoryValueBtc = products.reduce((acc, p) => acc + Number(p.price_btc) * (p.stock || 0), 0);

  const handleExportExcel = () => {
    const data = products.map((p) => ({
      'ID Producto': p.id,
      'SKU': p.sku || 'N/A',
      'Nombre': p.name,
      'Categoría': p.category,
      'Stock Actual': p.stock,
      'Estado Stock': p.stock <= 0 ? 'AGOTADO' : p.stock <= 3 ? 'BAJO STOCK' : 'DISPONIBLE',
      'Precio USD': Number(p.price_usd).toFixed(2),
      'Precio BTC': Number(p.price_btc).toFixed(8),
      'Valor Total Stock (USD)': (Number(p.price_usd) * p.stock).toFixed(2),
      'Valor Total Stock (BTC)': (Number(p.price_btc) * p.stock).toFixed(8),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
    XLSX.writeFile(workbook, `Reporte_Inventario_NexCoin_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`Reporte Oficial de Inventario y Stock`, 14, 18);
    doc.setFontSize(9);
    doc.text(`Proveedor: ${supplier?.company_name || 'NexCoin'} | ${new Date().toLocaleString()}`, 14, 25);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Total Unidades Físicas: ${totalStockUnits} | Valor Total: $${totalInventoryValueUsd.toFixed(2)} USD (${totalInventoryValueBtc.toFixed(8)} BTC)`, 14, 40);
    doc.text(`Productos Agotados (Stock 0): ${outOfStockList.length} | Productos en Bajo Stock: ${lowStockList.length}`, 14, 46);

    let y = 58;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    products.forEach((p, idx) => {
      const statusText = p.stock <= 0 ? '[SIN STOCK]' : `[Stock: ${p.stock}]`;
      doc.text(
        `${idx + 1}. ${statusText} ${p.name.substring(0, 40)} | SKU: ${p.sku || '-'} | $${Number(p.price_usd).toFixed(2)} USD`,
        14,
        y
      );
      y += 7;
    });

    doc.save(`Reporte_Inventario_NexCoin.pdf`);
  };

  return (
    <SupplierLayout
      title="Reporte de Inventario & Existencias"
      subtitle="Auditoría de almacén, existencias nulas, stock crítico y valorización total"
    >
      <div className="space-y-6">
        
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Resumen de Almacén:</span>
            <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-xl">
              {products.length} Referencias de Productos
            </span>
          </div>

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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Valor Inventario (USD)</span>
            <p className="text-2xl font-black text-white mt-2">${totalInventoryValueUsd.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">Precio venta al público</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Valor Inventario (BTC)</span>
            <p className="text-2xl font-black font-mono text-amber-400 mt-2">{totalInventoryValueBtc.toFixed(8)} ₿</p>
            <p className="text-xs text-slate-500 mt-1">Valorización en cripto</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Unidades Totales</span>
            <p className="text-2xl font-black text-blue-400 mt-2">{totalStockUnits} uds.</p>
            <p className="text-xs text-slate-500 mt-1">Existencias en depósito</p>
          </div>

          <div className={`p-5 rounded-2xl border ${
            outOfStockList.length > 0 ? 'bg-red-950/20 border-red-500/40' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-xs font-bold text-slate-400 uppercase">Sin Stock (Agotados)</span>
            <p className={`text-2xl font-black mt-2 ${outOfStockList.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {outOfStockList.length} productos
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {outOfStockList.length > 0 ? 'Pérdida de ventas potenciales' : 'Cero productos agotados'}
            </p>
          </div>

        </div>

        {/* OUT OF STOCK SPECIAL AUDIT TABLE */}
        {outOfStockList.length > 0 && (
          <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Productos que Actualmente NO Tienen Stock ({outOfStockList.length})</span>
              </div>
              <Link
                to="/proveedores/productos"
                className="text-xs font-bold text-red-300 hover:text-white underline flex items-center gap-1"
              >
                <span>Ir a reabastecer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-red-500/20 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3 text-right">Precio USD</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-500/10 font-medium">
                  {outOfStockList.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-bold text-white">{p.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{p.sku || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{p.category}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">${Number(p.price_usd).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold text-[10px]">
                          Stock 0 (Agotado)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FULL INVENTORY TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-500" />
              <span>Inventario Completo y Valorización</span>
            </h3>
            <span className="text-xs text-slate-500">{products.length} artículos en catálogo</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-3 text-right">P. Unit USD</th>
                  <th className="py-3 px-3 text-right">Valor Stock USD</th>
                  <th className="py-3 px-3 text-right">Valor Stock BTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {products.map((p) => {
                  const valUsd = Number(p.price_usd) * p.stock;
                  const valBtc = Number(p.price_btc) * p.stock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                        {p.name}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{p.category}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{p.sku || '—'}</td>
                      <td className="py-3 px-3 text-center">
                        {p.stock <= 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            0 Agotado
                          </span>
                        ) : p.stock <= 3 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {p.stock} (Bajo)
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold">{p.stock} uds.</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">${Number(p.price_usd).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-bold text-white">${valUsd.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-400">{valBtc.toFixed(8)} ₿</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </SupplierLayout>
  );
};
