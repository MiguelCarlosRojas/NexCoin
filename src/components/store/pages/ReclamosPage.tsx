import React from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { AlertCircle, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReclamosPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Servicio al cliente" pageTitle="Reclamos">
      <div className="w-full space-y-10">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            Atención de Disconformidades
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Gestión de Reclamos y Disputas
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
            Protocolo de atención para controversias sobre productos no recibidos, discrepancias de características físicas o fallas en compras liquidadas con Bitcoin.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white font-heading">Procedimiento de Disputa</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Presentación del Voucher</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                El comprador proporciona el código de voucher generado (`VCH-...`) o el número de orden emitido al confirmar el pago en Bitcoin.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Auditoría On-Chain</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Verificamos la firma criptográfica en el contrato inteligente `NexCoin.sol` y contactamos al proveedor responsable del despacho.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Resolución o Reembolso</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                En un plazo máximo de 48 horas el proveedor emite una solución: reemplazo del producto defectuoso o restitución del valor acordado.
              </p>
            </div>
          </div>
        </div>

        {/* Libro de reclamaciones link */}
        <div className="p-6 rounded-2xl bg-[#0e1628] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">¿Deseas asentar un reclamo formal ante las autoridades competentes?</h4>
            <p className="text-xs text-slate-400">Ingresa a nuestro Libro de Reclamaciones virtual oficial conforme al Código de Protección y Defensa del Consumidor.</p>
          </div>
          <Link
            to="/libro-de-reclamaciones"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2 shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            <span>Libro de Reclamaciones</span>
          </Link>
        </div>

      </div>
    </StorePageLayout>
  );
};
