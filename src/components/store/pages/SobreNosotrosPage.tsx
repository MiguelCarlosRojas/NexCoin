import React from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { Award, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SobreNosotrosPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Nosotros" pageTitle="Sobre nosotros">
      <div className="w-full space-y-10">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            Liderazgo en Comercio Web3
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Sobre Nosotros • NexCoin
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
            Somos la infraestructura de comercio electrónico descentralizado de última generación, conectando a fabricantes independientes, marcas verificadas y consumidores globales mediante la red Bitcoin.
          </p>
        </div>

        {/* Core Narrative */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Comercio P2P sin Intermediarios</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              En NexCoin eliminamos las pasarelas bancarias tradicionales que cobran comisiones excesivas y aplican retenciones injustificadas. Los pagos en Bitcoin se liquidan directamente a la billetera de los proveedores con total transparencia on-chain.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Garantía Smart Contract NexCoin.sol</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Cada transacción está protegida por contratos inteligentes que generan firmas criptográficas ECDSA inmutables. Tanto el comprador como el vendedor cuentan con un registro verificable en blockchain.
            </p>
          </div>
        </div>

        {/* Company History & Values */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed pt-2">
          <h2 className="text-xl font-bold text-white font-heading">Nuestra Historia</h2>
          <p>
            NexCoin nació con una visión clara: el dinero sólido (Bitcoin) debe ser el medio de intercambio fundamental en el comercio del siglo XXI. Desarrollamos una plataforma integral donde la experiencia de compra es tan fluida como la de las grandes plataformas convencionales, pero sin custodia forzosa ni intermediarios financieros.
          </p>
          <p>
            Nuestros proveedores cuentan con herramientas avanzadas para la gestión de catálogos en tiempo real, control de stock y emisión de comprobantes digitales certificados con opción de descarga en PDF y envío directo a Gmail.
          </p>
        </div>

        {/* Call to action banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white">¿Eres fabricante o proveedor de productos?</h4>
            <p className="text-xs text-slate-400">Publica tu catálogo y empieza a recibir pagos en Bitcoin hoy mismo.</p>
          </div>
          <Link
            to="/proveedores/login"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
          >
            <span>Portal Proveedores</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </StorePageLayout>
  );
};
