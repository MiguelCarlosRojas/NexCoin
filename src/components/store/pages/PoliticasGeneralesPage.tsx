import React from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { Truck, ShieldCheck, RefreshCw } from 'lucide-react';

export const PoliticasGeneralesPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Legales y Políticas" pageTitle="Políticas Generales">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-6 space-y-2">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-white/[0.1] text-slate-300 text-xs font-mono font-bold uppercase tracking-wider inline-block">
            Normativa Operativa
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Políticas Generales de la Tienda
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Estándares de calidad, políticas de despacho logístico, devoluciones y cumplimiento ético en NovaSats.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Truck className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Política de Envíos y Despacho</h3>
            </div>
            <p>
              Los productos adquiridos en la plataforma son despachados directamente por el proveedor asignado. Los plazos estimados de entrega varían entre 24 y 72 horas hábiles para envíos nacionales metropolitanos, y hasta 7 días hábiles para envíos interprovinciales. El comprador recibe un número de seguimiento asociado a su orden.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <RefreshCw className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Política de Cambios y Devoluciones</h3>
            </div>
            <p>
              El cliente puede solicitar el cambio o devolución de un producto dentro de los siete (7) días calendario posteriores a su recepción física, siempre que el artículo conserve sus empaques originales, etiquetas y no presente señales de uso indebido. En caso de fallas técnicas o defectos de fabricación, aplica la garantía legal de 12 meses.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">3. Política de Integridad del Proveedor</h3>
            </div>
            <p>
              Todo proveedor que forme parte de la red de NovaSats es auditado en su historial de ventas y cumplimiento. La publicación de productos apócrifos, información engañosa o la omisión reiterada de stock resultará en la suspensión inmediata e irrevocable de la cuenta del proveedor en la plataforma.
            </p>
          </div>
        </div>

      </div>
    </StorePageLayout>
  );
};
