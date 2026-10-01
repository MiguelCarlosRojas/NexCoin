import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bitcoin,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Store,
  LogIn,
  RotateCcw
} from 'lucide-react';

import { clearSupplierSession } from '../../lib/cookieSession';
import { useSupplier } from '../../context/SupplierContext';

export const SupplierLogout: React.FC = () => {
  const { logout } = useSupplier();

  useEffect(() => {
    // Ensure clean state upon reaching logout page
    logout();
    clearSupplierSession();
  }, []);

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Top Navbar */}
      <header className="border-b border-white/[0.08] bg-[#080c18]/90 backdrop-blur-xl px-6 sm:px-12 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
            <Bitcoin className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1 font-heading">
              Nex<span className="text-amber-500">Coin</span>
            </span>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block -mt-1 font-mono">
              Portal Proveedores
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#0e1424] hover:bg-[#161f38] border border-white/[0.08] hover:border-amber-500/30 rounded-xl transition"
        >
          <Store className="w-4 h-4 text-amber-400" />
          <span>Volver a la Tienda</span>
        </Link>
      </header>

      {/* Main Content Card (Full height centered) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
          
          {/* Animated Status Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#060911] border border-emerald-500/50">
              <Lock className="w-4 h-4 text-emerald-400" />
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-3">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              Desconexión Segura
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
              Sesión Finalizada Correctamente
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
              Has salido del Portal de Proveedores de NovaSats. Tu token de autenticación y claves locales han sido eliminados de este navegador.
            </p>
          </div>

          {/* Security Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
            <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/[0.08] space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cero Huella Local</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ninguna credencial sensible permanece guardada en la caché de este equipo.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/[0.08] space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bitcoin className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Productos On-Chain</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tu catálogo y órdenes continúan activos y disponibles para compradores globales.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/[0.08] space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Reconexión Inmediata</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Puedes volver a ingresar en cualquier instante con tus credenciales de proveedor.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/proveedores/login"
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/25 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión Nuevamente</span>
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#0e1424] hover:bg-[#161f38] border border-white/[0.1] hover:border-amber-500/30 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>Ir a la Tienda Principal</span>
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#04060c] py-6 px-6 sm:px-12 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© NovaSats Technologies S.A.C. • Infraestructura de Comercio Bitcoin</p>
        <span className="font-mono text-[11px] text-slate-600">Smart Contract: NovaSats.sol v2.0 • On-Chain Verificado</span>
      </footer>

    </div>
  );
};
