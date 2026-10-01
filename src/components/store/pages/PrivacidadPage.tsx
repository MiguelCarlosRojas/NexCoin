import React from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { ShieldCheck, Lock, EyeOff, Server, Database, CheckCircle2, Mail } from 'lucide-react';

export const PrivacidadPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Legales y Políticas" pageTitle="Cómo cuidamos tu privacidad">
      <div className="w-full space-y-12">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            Privacidad & Cifrado Web3
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Cómo Cuidamos tu Privacidad en NovaSats
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-4xl">
            Tu soberanía y confidencialidad son pilares fundamentales de nuestra arquitectura. Diseñamos un sistema de comercio electrónico descentralizado que minimiza la recolección de datos y elimina los intermediarios financieros invasivos.
          </p>
        </div>

        {/* Core Privacy Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Cero Rastreo Publicitario</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              No vendemos datos a agencias de publicidad ni insertamos píxeles de rastreo invasivos de redes sociales. Tu navegación en el catálogo es privada e independiente.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Sin Datos Bancarios Centralizados</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Al pagar con Bitcoin, no compartes números de tarjeta de crédito, fechas de caducidad ni CVV. La transacción se verifica directamente on-chain mediante firmas ECDSA.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Solo Datos Esenciales de Entrega</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Los únicos datos solicitados en el checkout (nombre, dirección y teléfono) se emplean exclusivamente para que el proveedor y el courier puedan despachar tu paquete físico.
            </p>
          </div>
        </div>

        {/* How Data is Handled in the System */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-6 rounded-2xl bg-[#090d18] border border-white/[0.08] space-y-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>1. Almacenamiento Cifrado y Entrega del Comprobante</span>
            </h3>
            <p>
              Cuando realizas una compra, el sistema genera tu comprobante oficial (Voucher) con su código único (ej. <code className="text-amber-400">VCH-XXXXXX</code>) y lo envía a tu dirección de correo electrónico a través del servicio de mensajería transaccional cifrada. Dicho voucher contiene únicamente el resumen de los productos adquiridos, el hash de la transacción y la firma criptográfica del contrato <code className="text-amber-400">NovaSats.sol</code>.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#090d18] border border-white/[0.08] space-y-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>2. Cumplimiento Normativo (Ley N° 29733 & GDPR)</span>
            </h3>
            <p>
              El banco de datos personales de NovaSats Technologies S.A.C. cumple estrictamente con los lineamientos de la Ley N° 29733 de Protección de Datos Personales de la República del Perú y los estándares globales del Reglamento General de Protección de Datos (GDPR). Implementamos medidas técnicas, organizativas y legales para evitar la alteración, pérdida o acceso no autorizado.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#090d18] border border-white/[0.08] space-y-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>3. Ejercicio de Derechos ARCO</span>
            </h3>
            <p>
              Como titular de tus datos, puedes ejercer en cualquier momento tus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong>. Puedes solicitar la supresión de tu historial de envíos de nuestra base de datos operativa una vez concluido el plazo legal de entrega y garantía del producto.
            </p>
            <p className="pt-2 text-slate-400">
              Para tramitar tu solicitud ARCO, envía un correo a: <strong className="text-amber-400 font-mono">privacidad@novasats.com</strong> adjuntando tu número de documento de identidad.
            </p>
          </div>
        </div>

        {/* Contact Banner */}
        <div className="p-6 rounded-2xl bg-[#0c1224] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white">Oficial de Cumplimiento & Privacidad</h4>
            <p className="text-xs text-slate-400">¿Dudas sobre cómo resguardamos tus datos en el contrato inteligente?</p>
          </div>
          <a
            href="mailto:privacidad@novasats.com"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2 shrink-0"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Consultar a Privacidad</span>
          </a>
        </div>

      </div>
    </StorePageLayout>
  );
};
