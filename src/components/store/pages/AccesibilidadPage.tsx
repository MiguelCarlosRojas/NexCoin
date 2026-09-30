import React from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { Eye, Keyboard, Monitor, CheckCircle2, Mail } from 'lucide-react';

export const AccesibilidadPage: React.FC = () => {
  return (
    <StorePageLayout categoryName="Legales y Políticas" pageTitle="Accesibilidad">
      <div className="w-full space-y-12">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" />
            Inclusión Digital & Estándares WCAG 2.1
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Declaración de Accesibilidad Universal en NexCoin
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-4xl">
            En NexCoin estamos comprometidos con asegurar que cualquier persona, independientemente de sus capacidades físicas, sensoriales o cognitivas, pueda acceder, navegar y realizar compras en Bitcoin con total autonomía y facilidad.
          </p>
        </div>

        {/* Accessibility Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Navegación Total por Teclado</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Todos los elementos interactivos (filtros de catálogo, selector de categorías, carrusel de fotos, modales de vouchers y botones de compra) son operables mediante la tecla Tab y Enter con indicadores de foco visibles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Alto Contraste Visual</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              La interfaz oscura de alta fidelidad está calibrada bajo ratios de contraste que superan la norma WCAG AA (mínimo 4.5:1), garantizando la legibilidad para personas con baja visión o fatiga ocular.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Monitor className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Lectores de Pantalla (Screen Readers)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Estructura semántica HTML5 con etiquetas ARIA, atributos <code className="text-amber-400">aria-label</code> y textos descriptivos en botones de compartir, miniaturas de fotos y comprobantes de pago.
            </p>
          </div>
        </div>

        {/* Detailed Standards in the system */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white font-heading">Nuestras Medidas Técnicas Implementadas</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#090d18] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Textos Alternativos en Imágenes</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Todas las fotos de productos subidas por los proveedores en el catálogo cuentan con descripciones textuales asociadas para su lectura por sintetizadores de voz.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090d18] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Compatibilidad con Zoom hasta 200%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                El diseño responsive permite ampliar el texto y los componentes de compra hasta el 200% sin pérdida de contenido ni desplazamiento horizontal descontrolado.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090d18] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Formularios y Modales Accesibles</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                El Libro de Reclamaciones, los modales de vouchers y el panel de administración de productos poseen etiquetas de formulario explícitas y mensajes de error comprensibles.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090d18] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Reducción de Movimiento (prefers-reduced-motion)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Respetamos las preferencias del sistema operativo reduciendo las animaciones del carrusel y las transiciones visuales para prevenir mareos en personas sensibles.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Channel */}
        <div className="p-6 rounded-2xl bg-[#0c1224] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white">¿Encontraste alguna barrera de accesibilidad?</h4>
            <p className="text-xs text-slate-400">Trabajamos continuamente para mejorar. Escríbenos y nuestro equipo técnico lo adaptará de inmediato.</p>
          </div>
          <a
            href="mailto:accesibilidad@nexcoin.com"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2 shrink-0"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>accesibilidad@nexcoin.com</span>
          </a>
        </div>

      </div>
    </StorePageLayout>
  );
};
