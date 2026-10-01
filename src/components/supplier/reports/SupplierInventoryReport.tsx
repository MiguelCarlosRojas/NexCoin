import React, { useState, useEffect, useMemo } from 'react';
import { SupplierLayout } from '../SupplierLayout';
import { useSupplier } from '../../../context/SupplierContext';
import { supabase } from '../../../lib/supabaseClient';
import { Product } from '../../../types/store';
import { useSearchParams, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { exportLandscapePdfTable } from '../../../lib/pdfReportGenerator';
import {
  Boxes,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';

export const SupplierInventoryReport: React.FC = () => {
  const { supplier } = useSupplier();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') || searchParams.get('search') || '';
  const urlFiltro = (searchParams.get('filtro') || searchParams.get('filter') || 'all').toLowerCase();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlQ);
  const [filterMode, setFilterMode] = useState<'all' | 'out_of_stock' | 'low_stock' | 'in_stock'>(() => {
    if (urlFiltro === 'agotados' || urlFiltro === 'out_of_stock') return 'out_of_stock';
    if (urlFiltro === 'bajo_stock' || urlFiltro === 'low_stock') return 'low_stock';
    if (urlFiltro === 'disponibles' || urlFiltro === 'in_stock') return 'in_stock';
    return 'all';
  });

  // Sync with URL params
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || '';
    const fParam = (searchParams.get('filtro') || searchParams.get('filter') || 'all').toLowerCase();

    if (qParam !== search) setSearch(qParam);
    if (fParam === 'agotados' || fParam === 'out_of_stock') setFilterMode('out_of_stock');
    else if (fParam === 'bajo_stock' || fParam === 'low_stock') setFilterMode('low_stock');
    else if (fParam === 'disponibles' || fParam === 'in_stock') setFilterMode('in_stock');
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

  const handleFilterModeChange = (mode: 'all' | 'out_of_stock' | 'low_stock' | 'in_stock') => {
    setFilterMode(mode);
    syncUrl(search, mode);
  };

  useEffect(() => {
    const fetchInventory = async () => {
      if (!supplier) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('supplier_id', supplier.id)
          .order('stock', { ascending: true });

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

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterMode === 'out_of_stock') return p.stock <= 0;
    if (filterMode === 'low_stock') return p.stock > 0 && p.stock <= 5;
    if (filterMode === 'in_stock') return p.stock > 5;

    return true;
  });

  const outOfStockList = products.filter((p) => p.stock <= 0);
  const lowStockList = products.filter((p) => p.stock > 0 && p.stock <= 5);

  const totalStockUnits = filteredProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryValueUsd = filteredProducts.reduce((acc, p) => acc + Number(p.price_usd) * (p.stock || 0), 0);
  const totalInventoryValueBtc = filteredProducts.reduce((acc, p) => acc + Number(p.price_btc) * (p.stock || 0), 0);

  // Paginación: 10 productos por página
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterMode]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Export to Horizontal Landscape PDF with autoTable
  const handleExportPdf = () => {
    const headers = [
      'SKU',
      'PRODUCTO / ARTÍCULO',
      'CATEGORÍA',
      'ESTADO STOCK',
      'STOCK',
      'PRECIO USD',
      'PRECIO BTC',
      'VALOR TOTAL USD',
      'VALOR TOTAL BTC'
    ];

    const rows = filteredProducts.map((p) => {
      const statusText = p.stock <= 0 ? 'AGOTADO' : p.stock <= 5 ? 'BAJO STOCK' : 'DISPONIBLE';
      const rowValUsd = Number(p.price_usd) * (p.stock || 0);
      const rowValBtc = Number(p.price_btc) * (p.stock || 0);

      return [
        p.sku || 'N/A',
        p.name,
        p.category || 'General',
        statusText,
        p.stock,
        `$${Number(p.price_usd).toFixed(2)}`,
        `${Number(p.price_btc).toFixed(8)} BTC`,
        `$${rowValUsd.toFixed(2)}`,
        `${rowValBtc.toFixed(8)} BTC`
      ];
    });

    const footers = [
      [
        'TOTALES',
        `${filteredProducts.length} Productos`,
        '—',
        '—',
        `${totalStockUnits} uds`,
        '—',
        '—',
        `$${totalInventoryValueUsd.toFixed(2)} USD`,
        `${totalInventoryValueBtc.toFixed(8)} BTC`
      ]
    ];

    exportLandscapePdfTable({
      title: 'Reporte Oficial de Inventario & Existencias de Almacén',
      supplierName: supplier?.company_name || 'NovaSats Partner',
      stats: [
        { label: 'Total Productos', value: `${filteredProducts.length}` },
        { label: 'Unidades en Stock', value: `${totalStockUnits} uds.` },
        { label: 'Valor Inventario USD', value: `$${totalInventoryValueUsd.toFixed(2)}` },
        { label: 'Valor Inventario BTC', value: `${totalInventoryValueBtc.toFixed(8)} BTC` },
      ],
      headers,
      rows,
      footers,
      fileName: `Reporte_Inventario_NovaSats_${new Date().toISOString().slice(0, 10)}.pdf`,
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28 },
        3: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
        5: { halign: 'right', cellWidth: 24 },
        6: { halign: 'right', textColor: [217, 119, 6], cellWidth: 28 },
        7: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 28 },
        8: { halign: 'right', textColor: [217, 119, 6], cellWidth: 28 },
      }
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredProducts.map((p) => ({
      'ID Producto': p.id,
      'SKU': p.sku || 'N/A',
      'Nombre': p.name,
      'Categoría': p.category,
      'Stock Actual': p.stock,
      'Estado Stock': p.stock <= 0 ? 'AGOTADO' : p.stock <= 5 ? 'BAJO STOCK' : 'DISPONIBLE',
      'Precio USD': Number(p.price_usd).toFixed(2),
      'Precio BTC': Number(p.price_btc).toFixed(8),
      'Valor Total Stock (USD)': (Number(p.price_usd) * p.stock).toFixed(2),
      'Valor Total Stock (BTC)': (Number(p.price_btc) * p.stock).toFixed(8),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
    XLSX.writeFile(workbook, `Reporte_Inventario_NovaSats_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <SupplierLayout
      title="Reporte de Inventario & Existencias"
      subtitle="Auditoría de almacén, existencias nulas, stock crítico y valorización total"
    >
      <div className="space-y-6 w-full max-w-full">
        
        {/* Actions bar */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-4 sm:p-5 rounded-2xl backdrop-blur-xl shadow-lg space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por producto, SKU o categoría..."
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
                  disabled={filteredProducts.length === 0}
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
                  disabled={filteredProducts.length === 0}
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
              Estado Stock:
            </span>
            {[
              { id: 'all', label: 'Todos los Productos' },
              { id: 'out_of_stock', label: `Agotados (${outOfStockList.length})` },
              { id: 'low_stock', label: `Bajo Stock (${lowStockList.length})` },
              { id: 'in_stock', label: 'Disponibles (>5)' },
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

        {/* Inventory Summary Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Unidades Físicas</span>
            <p className="text-2xl font-black text-white mt-2 font-heading">{totalStockUnits} uds.</p>
          </div>
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Valor Total (USD)</span>
            <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
              ${totalInventoryValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Valor On-Chain (BTC)</span>
            <p className="text-2xl font-black font-mono text-amber-400 mt-2">
              {totalInventoryValueBtc.toFixed(8)} ₿
            </p>
          </div>
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Stock Crítico</span>
            <p className="text-2xl font-black text-rose-400 mt-2 font-heading">
              {outOfStockList.length} agotados / {lowStockList.length} bajos
            </p>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Boxes className="w-4 h-4 text-amber-500" />
              <span>Listado de Existencias en Almacén</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{filteredProducts.length} productos</span>
          </div>

          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">SKU / ID</th>
                    <th className="py-3 px-3">Producto</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3 text-center">Estado Stock</th>
                    <th className="py-3 px-3 text-center">Existencias</th>
                    <th className="py-3 px-3 text-right">Precio USD</th>
                    <th className="py-3 px-3 text-right">Valor Total USD</th>
                    <th className="py-3 px-4 text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4"><div className="h-3.5 bg-white/[0.06] rounded w-20" /></td>
                      <td className="py-3 px-3"><div className="h-3.5 bg-white/[0.06] rounded w-44" /></td>
                      <td className="py-3 px-3"><div className="h-3 bg-white/[0.05] rounded w-24" /></td>
                      <td className="py-3 px-3 text-center"><div className="h-5 bg-white/[0.06] rounded-full w-20 mx-auto" /></td>
                      <td className="py-3 px-3 text-center"><div className="h-4 bg-white/[0.06] rounded w-12 mx-auto" /></td>
                      <td className="py-3 px-3 text-right"><div className="h-4 bg-white/[0.06] rounded w-16 ml-auto" /></td>
                      <td className="py-3 px-3 text-right"><div className="h-4 bg-white/[0.06] rounded w-20 ml-auto" /></td>
                      <td className="py-3 px-4 text-right"><div className="h-6 bg-white/[0.06] rounded-lg w-16 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center text-slate-500">No se encontraron productos con los filtros seleccionados.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">SKU / ID</th>
                    <th className="py-3 px-3">Producto</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3 text-center">Estado Stock</th>
                    <th className="py-3 px-3 text-center">Existencias</th>
                    <th className="py-3 px-3 text-right">Precio USD</th>
                    <th className="py-3 px-3 text-right">Valor Total USD</th>
                    <th className="py-3 px-4 text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-medium">
                  {paginatedProducts.map((p) => {
                    const isOut = p.stock <= 0;
                    const isLow = p.stock > 0 && p.stock <= 5;
                    const rowValUsd = Number(p.price_usd) * (p.stock || 0);

                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {p.sku || p.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-white text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.condition || 'Nuevo'}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          {p.category || 'General'}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              Agotado
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Bajo Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Disponible
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-white">
                          {p.stock}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-300 font-mono">
                          ${Number(p.price_usd).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-emerald-400 font-mono">
                          ${rowValUsd.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/proveedores/productos?q=${encodeURIComponent(p.name)}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
                          >
                            <span>Editar</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación (10 productos por página) */}
            {filteredProducts.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0a0f1d]/90 border border-white/[0.08] text-xs text-slate-400 mt-5">
                <div>
                  Mostrando <span className="text-white font-bold">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)}</span> - <span className="text-white font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> de <span className="text-white font-bold">{filteredProducts.length}</span> productos (10 por página)
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
