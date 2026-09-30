import React from 'react';
import { StorePageLayout } from '../StorePageLayout';

export const TerminosCondicionesPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Legales y Políticas" pageTitle="Términos y condiciones">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-6 space-y-2">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-white/[0.1] text-slate-300 text-xs font-mono font-bold uppercase tracking-wider inline-block">
            Contrato de Adhesión Digital
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Términos y Condiciones Generales
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Última actualización: Septiembre 2026. Al navegar, conectar tu billetera o adquirir productos en NexCoin, aceptas plenamente las siguientes condiciones.
          </p>
        </div>

        {/* Content Clauses */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Naturaleza Tecnológica de la Plataforma</h3>
            <p>
              NexCoin es una plataforma de software que facilita la publicación descentralizada de productos por parte de proveedores independientes y la compra mediante pagos directos en Bitcoin (BTC). NexCoin no opera como entidad bancaria ni custodia fondos fiduciarios.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Transacciones Cripto y Protocolo Descentralizado</h3>
            <p>
              Los montos calculados en Bitcoin y criptoactivos se determinan mediante el índice de cambio spot en USD en tiempo real. Al autorizar la transferencia, se genera una firma criptográfica ECDSA verificada on-chain en el protocolo NexCoin. Debido a la naturaleza matemática de la blockchain, las transferencias son irrevocables una vez confirmadas en el bloque de red.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">3. Obligaciones y Garantías del Proveedor</h3>
            <p>
              Cada proveedor registrado es responsable exclusivo de la veracidad de la información de sus productos, la exactitud del stock declarado, el empaque adecuado y el despacho puntual. Los proveedores asumen las garantías de fábrica y el derecho de reposición de los consumidores.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">4. Validez del Voucher de Compra</h3>
            <p>
              Al completarse una compra, se genera automáticamente un Voucher Criptográfico con código único (`VCH-...`), número de orden y hash de verificación. Dicho comprobante digital constituye prueba formal de adquisición y es admisible ante cualquier proceso de garantía o reclamo.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">5. Ley Aplicable y Jurisdicción</h3>
            <p>
              Los presentes términos se rigen por la legislación civil y mercantil de la República del Perú y los estándares internacionales de comercio electrónico. Cualquier discrepancia no resuelta por mutuo acuerdo será sometida a los tribunales arbitrales o judiciales de Lima, Perú.
            </p>
          </div>
        </div>

      </div>
    </StorePageLayout>
  );
};
