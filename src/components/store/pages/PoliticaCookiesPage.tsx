import React from 'react';
import { StorePageLayout } from '../StorePageLayout';

export const PoliticaCookiesPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Legales y Políticas" pageTitle="Política de cookies">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-6 space-y-2">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-white/[0.1] text-slate-300 text-xs font-mono font-bold uppercase tracking-wider inline-block">
            Privacidad & Almacenamiento
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Política de Cookies & Almacenamiento Local
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Conoce cómo NexCoin emplea almacenamiento técnico local para optimizar tu experiencia de compra Web3 y conservar tu carrito de productos.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. ¿Qué información almacenamos en tu navegador?</h3>
            <p>
              NexCoin no utiliza cookies de seguimiento publicitario de terceros ni píxeles invasivos. Utilizamos exclusivamente almacenamiento local (`localStorage`) en tu propio navegador con fines estrictamente funcionales:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
              <li><strong>Carrito de Compras:</strong> Recordar los artículos, cantidades y precios agregados a tu bolsa.</li>
              <li><strong>Sesión de Billetera:</strong> Guardar la dirección pública de tu Wallet para no solicitar reconexión en cada navegación.</li>
              <li><strong>Sesión de Proveedor:</strong> Token seguro de autenticación en Supabase para el panel de proveedores.</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Control y Eliminación</h3>
            <p>
              Puedes borrar en cualquier instante los datos locales almacenados desde la configuración de tu navegador web o pulsando el botón "Salir" en el componente de billetera o en el panel de sesión del proveedor.
            </p>
          </div>
        </div>

      </div>
    </StorePageLayout>
  );
};
