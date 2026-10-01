import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bitcoin,
  HeartHandshake,
  CheckCircle2,
  Store,
  ShieldCheck,
  UserPlus,
  HelpCircle
} from 'lucide-react';

export const SupplierAccountDeletedPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Cuenta Eliminada con Éxito | Muchas Gracias - NovaSats';
  }, []);

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Simple Header */}
      <header className="h-20 border-b border-white/[0.08] bg-[#0a0f1d]/80 backdrop-blur-xl px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Bitcoin className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              Nova<span className="text-amber-500">Sats</span>
            </span>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block -mt-1">
              Marketplace Web3
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-white/[0.08] transition"
        >
          <Store className="w-4 h-4 text-amber-400" />
          <span>Ir a la Tienda</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-3xl bg-[#0a0f1d] border border-white/[0.1] rounded-3xl p-6 sm:p-12 shadow-2xl relative overflow-hidden text-center space-y-8">
          
          {/* Subtle background glow */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
            <HeartHandshake className="w-10 h-10" />
            <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-slate-950 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cuenta y Catálogo Eliminados de Forma Segura
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-heading">
              ¡Muchas Gracias por Trabajar con Nosotros!
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Ha sido un auténtico privilegio contar con tu empresa como aliado comercial en <strong className="text-white">NovaSats Marketplace</strong>. 
              Valoramos enormemente cada producto publicado, cada orden atendida y la confianza que depositaste en nuestro ecosistema de pagos Bitcoin.
            </p>
          </div>

          {/* Informational Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Inventario y Datos Respaldados</span>
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Tu inventario fue descargado en formato Excel antes de la eliminación para que mantengas el registro completo de tus referencias comerciales.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Puertas Abiertas para el Futuro</span>
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Si en cualquier momento deseas reincorporarte al comercio Web3 y pagos en criptomonedas, podrás crear una nueva cuenta cuando lo desees.
              </p>
            </div>
          </div>

          {/* Farewell quote */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 text-slate-300 text-xs sm:text-sm italic">
            "El futuro del comercio electrónico descentralizado se construye paso a paso con empresas valientes y comprometidas. Te deseamos el mayor de los éxitos en todos tus proyectos presentes y futuros."
            <span className="block mt-2 font-mono font-semibold text-amber-400 not-italic text-xs">
              — El Equipo de NovaSats Marketplace
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/20 transition active:scale-95"
            >
              <Store className="w-4 h-4" />
              <span>Explorar Tienda NovaSats</span>
            </Link>

            <Link
              to="/trabaja-con-nosotros"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-xs border border-white/[0.1] transition"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Trabaja con Nosotros</span>
            </Link>

            <Link
              to="/servicio-al-cliente"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 font-semibold text-xs border border-white/[0.06] transition"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Servicio al Cliente</span>
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-white/[0.08] bg-[#0a0f1d]/50 px-6 sm:px-12 flex items-center justify-between text-xs text-slate-500">
        <p>© {new Date().getFullYear()} NovaSats. Todos los derechos reservados.</p>
        <div className="flex items-center gap-4">
          <Link to="/privacidad" className="hover:text-slate-300 transition">Privacidad</Link>
          <Link to="/terminos-y-condiciones" className="hover:text-slate-300 transition">Términos</Link>
        </div>
      </footer>

    </div>
  );
};
