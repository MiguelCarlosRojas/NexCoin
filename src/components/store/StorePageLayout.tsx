import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { CartDrawer } from '../shared/CartDrawer';
import {
  Bitcoin,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  Store,
  Receipt
} from 'lucide-react';

interface StorePageLayoutProps {
  categoryName: string;
  pageTitle: string;
  children: React.ReactNode;
}

const BTC_PRICE_USD = 65000;

export const StorePageLayout: React.FC<StorePageLayoutProps> = ({
  categoryName,
  pageTitle,
  children
}) => {
  const { itemCount, setIsCartOpen } = useCart();

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Top Ticker Bar (Exact match with Landing Page) */}
      <div className="bg-[#04060c] border-b border-white/[0.06] text-[11px] font-mono text-slate-400 py-2 px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Red Bitcoin: Bloque Verificado</span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">1 BTC = ${BTC_PRICE_USD.toLocaleString()} USD</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-slate-400">Smart Contract: NexCoin.sol v2.0</span>
          <Link
            to="/#consultar-voucher"
            className="text-slate-300 hover:text-amber-400 transition flex items-center gap-1"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>Consultar Voucher</span>
          </Link>
        </div>
      </div>

      {/* Main Navbar (Minimalist, without Wallet button, clean brand and return link) */}
      <header className="sticky top-0 z-40 bg-[#060911]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <Bitcoin className="w-6 h-6 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1 font-heading">
                Nex<span className="text-amber-500">Coin</span>
              </span>
              <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-widest block -mt-1 font-mono">
                Store Marketplace
              </span>
            </div>
          </Link>
        </div>

        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#0e1424] hover:bg-[#161f38] border border-white/[0.08] hover:border-amber-500/30 rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Volver a la Tienda</span>
          </Link>
        </div>
      </header>

      {/* Breadcrumb Bar */}
      <div className="bg-[#04060c] border-b border-white/[0.06] py-3.5 px-4 sm:px-8 lg:px-12">
        <div className="w-full flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link to="/" className="hover:text-amber-400 transition flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>Tienda</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-slate-400">{categoryName}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-amber-400 font-bold truncate">{pageTitle}</span>
        </div>
      </div>

      {/* Main Page Content (Full available width) */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-10">
        {children}
      </main>

      {/* FLOATING SHOPPING CART BUTTON (Bottom-Right Corner) */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black flex items-center justify-center shadow-2xl shadow-amber-500/30 border border-amber-300/40 hover:scale-110 active:scale-95 transition-all duration-300 group"
        title="Ver bolsa de compras"
        aria-label="Ver bolsa de compras"
      >
        <ShoppingBag className="w-6 h-6 text-black stroke-[2.2] group-hover:rotate-6 transition-transform" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 bg-black text-amber-400 font-black text-xs font-mono rounded-full border-2 border-amber-400 flex items-center justify-center shadow-lg animate-bounce">
            {itemCount}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Unified Minimalist Footer */}
      <footer className="border-t border-white/[0.08] bg-[#04060c] pt-14 pb-8 px-4 sm:px-8 lg:px-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <span className="text-lg font-black tracking-tight text-white font-heading">
                Nex<span className="text-amber-500">Coin</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Plataforma de comercio electrónico descentralizado respaldada en la red Bitcoin con firmas de contrato inteligente `NexCoin.sol`.
            </p>
            <div className="pt-1">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                100% Non-Custodial P2P
              </span>
            </div>
          </div>

          {/* Col 1: Nosotros */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Nosotros
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/trabaja-con-nosotros" className="hover:text-amber-400 transition block">
                  Trabaja con nosotros
                </Link>
              </li>
              <li>
                <Link to="/sobre-nosotros" className="hover:text-amber-400 transition block">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link to="/nuestro-proposito" className="hover:text-amber-400 transition block">
                  Nuestro propósito
                </Link>
              </li>
              <li>
                <Link to="/promociones" className="hover:text-amber-400 transition block">
                  Promociones
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Servicio al cliente & Ayuda */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Servicio al cliente & Ayuda
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/ayuda" className="hover:text-amber-400 transition block">
                  Ayuda
                </Link>
              </li>
              <li>
                <Link to="/servicio-al-cliente" className="hover:text-amber-400 transition block">
                  Servicio al cliente
                </Link>
              </li>
              <li>
                <Link to="/reclamos" className="hover:text-amber-400 transition block">
                  Reclamos
                </Link>
              </li>
              <li>
                <Link to="/libro-de-reclamaciones" className="hover:text-amber-400 transition font-bold text-amber-400/90 block">
                  Libro de reclamaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legales y Políticas */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Legales y Políticas
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/terminos-y-condiciones" className="hover:text-amber-400 transition block">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link to="/como-cuidamos-tu-privacidad" className="hover:text-amber-400 transition block">
                  Cómo cuidamos tu privacidad
                </Link>
              </li>
              <li>
                <Link to="/accesibilidad" className="hover:text-amber-400 transition block">
                  Accesibilidad
                </Link>
              </li>
              <li>
                <Link to="/politica-cookies" className="hover:text-amber-400 transition block">
                  Política de cookies
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-bar */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© Todos los derechos reservados • NexCoin Technologies S.A.C.</p>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
            <span>Bitcoin Network Verified</span>
            <span>•</span>
            <span>NexCoin.sol • On-Chain</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
