import React from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { Target, Compass, Lock, Zap, Shield, Sparkles } from 'lucide-react';

export const NuestroPropositoPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Nosotros" pageTitle="Nuestro propósito">
      <div className="w-full space-y-10">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" />
            Propósito & Principios
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Nuestro Propósito
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
            Democratizar el intercambio comercial a nivel global, devolviendo la soberanía financiera a los productores y a los consumidores a través de la tecnología descentralizada.
          </p>
        </div>

        {/* Misión y Visión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#0e1526] border border-white/[0.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-amber-400 uppercase tracking-wide">Misión</h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Construir una pasarela de comercio electrónico transparente y robusta, donde los bienes cotidianos se intercambien libremente por Bitcoin, con confirmaciones on-chain instantáneas y comprobantes criptográficos inmutables.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1526] border border-white/[0.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-orange-400 uppercase tracking-wide">Visión</h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Consolidarnos como el marketplace Web3 de referencia a nivel hispanohablante y global, permitiendo a cualquier comercio integrarse al estándar Bitcoin sin fricciones técnicas y con pleno respaldo legal.
            </p>
          </div>
        </div>

        {/* Pilares Fundamentales */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white font-heading">Nuestros Pilares</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Soberanía Total</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tus activos no están en manos de un custodio centralizado. Controlas tus llaves privadas y tus pagos.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Eficiencia Inmediata</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eliminamos el fraude por contracargos bancarios y permitimos transacciones directas entre pares.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Seguridad de Código</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada orden es respaldada por el Smart Contract NexCoin.sol v2.0 con validación criptográfica matemática.
              </p>
            </div>
          </div>
        </div>

      </div>
    </StorePageLayout>
  );
};
