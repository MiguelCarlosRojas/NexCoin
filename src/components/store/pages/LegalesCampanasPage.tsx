import React from 'react';
import { StorePageLayout } from '../StorePageLayout';

export const LegalesCampanasPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Legales y Políticas" pageTitle="Legales de campañas">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-6 space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider inline-block">
            Términos Promocionales
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Legales de Campañas & Promociones
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Reglas de participación, límites de stock y condiciones para cupones, promociones y descuentos en Bitcoin.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Vigencia y Stock Promocional</h3>
            <p>
              Toda campaña de descuento o beneficio promocional anunciada en la tienda estará vigente durante el plazo estipulado en las comunicaciones oficiales de NovaSats o hasta agotar el stock de unidades reservadas por el proveedor para dicha campaña.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Promociones con Descuento en Bitcoin</h3>
            <p>
              Las promociones que involucren bonificaciones en satoshis, recompensas on-chain o descuentos en el precio final en BTC se calculan al momento exacto de la emisión de la orden en el checkout. La fluctuación del mercado de Bitcoin posterior al pago no afecta el monto liquidado.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">3. Restricciones y No Acumulabilidad</h3>
            <p>
              Salvo indicación expresa en las condiciones particulares de la oferta, los cupones y códigos de descuento no son acumulables con otras promociones concurrentes ni canjeables por dinero fiduciario en efectivo.
            </p>
          </div>
        </div>

      </div>
    </StorePageLayout>
  );
};
