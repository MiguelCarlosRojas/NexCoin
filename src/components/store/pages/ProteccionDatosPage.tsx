import React from 'react';
import { StorePageLayout } from '../StorePageLayout';

export const ProteccionDatosPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Legales y Políticas" pageTitle="Protección de datos">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-6 space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider inline-block">
            Ley N° 29733 (LPDP) & GDPR
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Protección de Datos Personales
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Tratamiento, confidencialidad y ejercicio de derechos ARCO en cumplimiento del marco regulatorio de datos personales.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Responsable del Banco de Datos</h3>
            <p>
              El banco de datos personales derivado de las operaciones de compra y registro es gestionado por <strong>NEXCOIN TECHNOLOGIES S.A.C.</strong>, con domicilio en Av. Javier Prado Este 4200, Santiago de Surco, Lima - Perú.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Finalidad del Tratamiento</h3>
            <p>
              Los datos recabados (nombres, documento, correo, dirección de entrega y teléfono) se emplean estrictamente para la tramitación de las órdenes de compra, despacho físico de productos por los proveedores, emisión del voucher de compra y atención de reclamos o garantías.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">3. Ejercicio de Derechos ARCO</h3>
            <p>
              En cualquier momento, los titulares de los datos pueden ejercer sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong> enviando una comunicación escrita con el asunto "Derechos ARCO" a nuestro correo de privacidad:
            </p>
            <p className="font-mono text-amber-400 text-xs">privacidad@nexcoin.com</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">4. Privacidad Criptográfica de la Billetera</h3>
            <p>
              NexCoin preserva la naturaleza descentralizada de Bitcoin. Tu dirección de billetera pública solo interactúa con el contrato inteligente `NexCoin.sol` para registrar la orden de compra y la firma criptográfica del voucher sin transferir datos bancarios a servidores centrales.
            </p>
          </div>
        </div>

      </div>
    </StorePageLayout>
  );
};
