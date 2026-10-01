import React from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { HelpCircle, Mail, Phone, Receipt, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ServicioClientePage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Servicio al cliente" pageTitle="Servicio al cliente">
      <div className="w-full space-y-10">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Canales de Atención 24/7
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Servicio al Cliente • NovaSats
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
            Estamos disponibles para asistirte en todo momento con tus compras en Bitcoin, seguimiento de órdenes, verificación de vouchers o comunicación con proveedores.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Atención por Correo</h3>
            <p className="text-sm font-mono text-amber-400">soporte@novasats.com</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atención prioritaria los 365 días del año. Tiempo medio de respuesta: menos de 2 horas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Central Telefónica / WhatsApp</h3>
            <p className="text-sm font-mono text-emerald-400">+51 (01) 748-9200</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lunes a Domingo de 8:00 AM a 10:00 PM (GMT-5). Asistencia en español e inglés.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Validación de Vouchers</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Deseas corroborar la validez de tu comprobante o reenviártelo a Gmail? Utiliza el buscador de vouchers disponible en la página de inicio o accede con tu código de orden.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sede Corporativa</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Av. Javier Prado Este 4200, Santiago de Surco, Lima - Perú. Atención presencial con cita previa.
            </p>
          </div>
        </div>

        {/* Action card */}
        <div className="p-6 rounded-2xl bg-[#0e1628] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">¿Tienes alguna disconformidad con un producto?</h4>
            <p className="text-xs text-slate-400">Puedes ingresar una solicitud a través de nuestra sección de Reclamos o registrar una hoja en el Libro de Reclamaciones.</p>
          </div>
          <Link
            to="/libro-de-reclamaciones"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition shrink-0"
          >
            Libro de Reclamaciones
          </Link>
        </div>

      </div>
    </StorePageLayout>
  );
};
