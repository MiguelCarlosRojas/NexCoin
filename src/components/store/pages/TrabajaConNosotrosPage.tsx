import React from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { Briefcase, Building2, Code2, Truck, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrabajaConNosotrosPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Nosotros" pageTitle="Trabaja con nosotros">
      <div className="w-full space-y-12">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5" />
            Ecosistema de Oportunidades Web3
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Trabaja con Nosotros en NexCoin
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-4xl">
            Únete a la plataforma pionera de comercio electrónico descentralizado sobre la red Bitcoin. Buscamos proveedores de productos, fabricantes de hardware crypto, operadores logísticos y desarrolladores blockchain para expandir el nuevo estándar del comercio digital.
          </p>
        </div>

        {/* Roles & Collaboration Pathways */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Proveedores & Marcas</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Publica tu catálogo con modales de alta velocidad, gestiona tu stock en tiempo real y recibe pagos directos en Bitcoin sin retenciones bancarias ni intermediarios.
              </p>
            </div>
            <Link
              to="/proveedores/login"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline"
            >
              <span>Acceder al Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Desarrolladores Web3</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Colabora en la evolución de nuestros contratos inteligentes <code className="text-amber-400">NexCoin.sol</code>, integración de APIs on-chain, oráculos de precios y microservicios de vouchers digitales.
              </p>
            </div>
            <a
              href="mailto:devs@nexcoin.com"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
            >
              <span>devs@nexcoin.com</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Socios Logísticos</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Empresas de paquetería y courier con soporte de rastreo satelital para despachos exprés (24h) y envíos seguros a nivel nacional con verificación de código de voucher.
              </p>
            </div>
            <a
              href="mailto:logistica@nexcoin.com"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              <span>logistica@nexcoin.com</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Embajadores Crypto</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Difunde la adopción del estándar Bitcoin y comparte productos mediante enlaces inteligentes en WhatsApp, X, Telegram y redes sociales ganando comisiones verificadas.
              </p>
            </div>
            <a
              href="mailto:comunidad@nexcoin.com"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline"
            >
              <span>comunidad@nexcoin.com</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Benefits for Suppliers & Team */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white font-heading">¿Por qué incorporarse al sistema NexCoin?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-[#0b1020] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <h4 className="text-sm font-bold text-white">Liquidación 100% P2P</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cobras directamente a tu dirección de Bitcoin. Cero retenciones arbitrarias de pasarelas tradicionales y sin riesgo de contracargos fraudulentos.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b1020] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <h4 className="text-sm font-bold text-white">Identidad Visual Blobatar</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configura tu identidad Web3 con avatares procedurales Blobatar que distinguen a tu marca ante los compradores del marketplace.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b1020] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <h4 className="text-sm font-bold text-white">Vouchers Firmados On-Chain</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada orden genera comprobantes digitales con hash criptográfico respaldado por el Smart Contract NexCoin.sol v2.0, descargable en PDF y auditable en la red.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Box */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-lg font-black text-white">¿Listo para empezar a vender como proveedor?</h3>
            <p className="text-xs text-slate-300">
              Registra tu empresa en menos de dos minutos y empieza a publicar productos en la red Bitcoin hoy mismo.
            </p>
          </div>
          <Link
            to="/proveedores/login"
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition flex items-center gap-2 shrink-0"
          >
            <span>Crear Cuenta de Proveedor</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </StorePageLayout>
  );
};
