import React from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { Tag, Truck, Zap, ShoppingBag, ArrowRight, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PromocionesPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Nosotros" pageTitle="Promociones">
      <div className="w-full space-y-12">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Percent className="w-3.5 h-3.5" />
            Ofertas & Beneficios On-Chain
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Promociones & Descuentos en NexCoin
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-4xl">
            Aprovecha precios exclusivos y descuentos directos en Bitcoin en nuestro catálogo de billeteras frías, seguridad crypto, minería y moda descentralizada. En NexCoin los descuentos se liquidan al valor exacto del bloque sin comisiones bancarias ocultas.
          </p>
        </div>

        {/* Promo Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/30 to-[#0c1224] border border-rose-500/30 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Tag className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500 text-white inline-block">
                Hasta -25% OFF
              </span>
              <h3 className="text-base font-bold text-white">Descuentos Flash de Catálogo</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Productos seleccionados por los proveedores con rebajas directas sobre el precio regular en USD y liquidados a menor cantidad de BTC en el checkout.
              </p>
            </div>
            <Link
              to="/#catalogo"
              className="inline-flex items-center gap-2 text-xs font-black text-rose-400 hover:text-rose-300 uppercase tracking-wider mt-4"
            >
              <span>Ver Productos con Descuento</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-[#0c1224] border border-emerald-500/30 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Truck className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-600 text-white inline-block">
                Costo 0 BTC
              </span>
              <h3 className="text-base font-bold text-white">Envíos Gratis a Todo el País</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Identifica los productos con la insignia de Envío Gratis. Los proveedores asumen íntegramente el flete de despacho con entrega garantizada de 24 a 48 horas.
              </p>
            </div>
            <Link
              to="/#catalogo"
              className="inline-flex items-center gap-2 text-xs font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-wider mt-4"
            >
              <span>Explorar con Envío Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 to-[#0c1224] border border-amber-500/30 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500 text-black inline-block font-black">
                Despacho Prioritario
              </span>
              <h3 className="text-base font-bold text-white">Despacho Express 24h</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Productos con inventario de entrega inmediata. Al confirmar la transacción en la red Bitcoin, el proveedor procesa tu paquete con prioridad de 24 horas.
              </p>
            </div>
            <Link
              to="/#catalogo"
              className="inline-flex items-center gap-2 text-xs font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider mt-4"
            >
              <span>Ver Productos Express</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* How promotions work in the system */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white font-heading">¿Cómo funcionan las promociones en el Smart Contract?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/[0.08] space-y-2">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">1. Conversión Spot Real</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                El precio descontado en USD se divide exactamente entre la cotización spot de Bitcoin en tiempo real (1 BTC = $65,000 USD), calculando los Satoshis exactos a pagar.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/[0.08] space-y-2">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">2. Comprobante VCH Sellado</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                El voucher generado (<code className="text-slate-300">VCH-...</code>) refleja el porcentaje de descuento aplicado, el ahorro en satoshis y la firma ECDSA del contrato NexCoin.sol.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090e1c] border border-white/[0.08] space-y-2">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">3. Sin Requisitos Bancarios</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No requieres tarjetas de crédito bancarias ni membresías costosas para acceder a los precios con descuento. Cualquier billetera compatible con Bitcoin puede pagar al instante.
              </p>
            </div>
          </div>
        </div>

        {/* Direct Link to Store Filter */}
        <div className="p-8 rounded-2xl bg-[#0a1022] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Explora el Catálogo Completo</h3>
            <p className="text-xs text-slate-400">Filtra por descuento, envío gratis, rango de precio o categoría en nuestra tienda principal.</p>
          </div>
          <Link
            to="/"
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ir a la Tienda de Ofertas</span>
          </Link>
        </div>

      </div>
    </StorePageLayout>
  );
};
