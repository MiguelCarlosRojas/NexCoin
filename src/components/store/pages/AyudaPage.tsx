import React, { useState } from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { HelpCircle, Bitcoin, Receipt, Search, Truck, ShieldCheck, ChevronDown, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'Pagos con Bitcoin',
    q: '¿Cómo realizo el pago de un producto en NexCoin?',
    a: 'Selecciona tus productos y agrégalos a tu carrito. Al presionar "Pagar con Bitcoin", el sistema calculará la suma exacta en BTC y Satoshis según la tasa spot. Podrás escanear el código QR con cualquier billetera compatible (Electrum, BlueWallet, Muun, Binance, etc.) o copiar la dirección pública para transferir. Una vez recibida la confirmación de la red, la orden se sellará automáticamente.'
  },
  {
    category: 'Vouchers & Facturación',
    q: '¿Qué es el Voucher Criptográfico y para qué sirve?',
    a: 'Es tu comprobante digital de compra oficial emitido por NexCoin. Contiene un código único (ejemplo: VCH-948102), el resumen de los productos, la dirección de entrega, el hash de transacción y la firma criptográfica del contrato inteligente NexCoin.sol. Puedes descargarlo en formato PDF o enviártelo directamente a tu correo Gmail.'
  },
  {
    category: 'Vouchers & Facturación',
    q: '¿Cómo consulto el estado de mi orden o recupero mi voucher?',
    a: 'En la parte superior de la Tienda Principal encontrarás el botón "Consultar Voucher" o la sección de consulta. Solo necesitas ingresar tu código de voucher (VCH-...) o el número de orden generado al momento de la compra para visualizar el comprobante completo, reimprimirlo o enviártelo a tu correo.'
  },
  {
    category: 'Envíos & Logística',
    q: '¿Cuánto tiempo tarda en llegar mi pedido?',
    a: 'Depende de la modalidad del producto. Los artículos con "Express 24h" se entregan dentro de las primeras 24 horas tras la confirmación de la transacción en blockchain. Los envíos regulares tardan entre 24 a 48 horas en zonas metropolitanas y hasta 4 días hábiles para provincias. El proveedor te facilitará el número de seguimiento.'
  },
  {
    category: 'Proveedores & Seguridad',
    q: '¿Quién respalda las transacciones y la calidad del producto?',
    a: 'Cada producto es vendido y despachado por proveedores verificados con identidad Web3 y avatares Blobatar. Cada transacción queda registrada y verificada on-chain mediante el protocolo criptográfico NexCoin. Si un producto presenta defectos de fábrica o no coincide con la descripción, dispones del protocolo de Reclamos y el Libro de Reclamaciones conforme a la Ley N° 29571.'
  },
  {
    category: 'Proveedores & Seguridad',
    q: '¿Cómo puedo hacer una pregunta al proveedor antes de comprar?',
    a: 'Dentro de la página de detalle de cualquier producto (/producto/:id), encontrarás la sección "Preguntas y Respuestas". Puedes escribir tu consulta directamente o hacer clic en "Contactar" en la tarjeta del proveedor para enviarle un correo electrónico.'
  }
];

export const AyudaPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [searchFilter, setSearchFilter] = useState('');

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.a.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <StorePageLayout categoryName="Servicio al cliente & Ayuda" pageTitle="Ayuda">
      <div className="w-full space-y-12">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Centro de Ayuda & Guía del Sistema
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            ¿En qué podemos ayudarte hoy?
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-4xl">
            Aprende cómo funciona el marketplace descentralizado NexCoin: pagos directos en Bitcoin, emisión y validación de vouchers con contrato inteligente, plazos de envío y soporte técnico.
          </p>

          {/* Quick Search */}
          <div className="pt-2 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por tema: voucher, pagar con bitcoin, envíos, proveedor..."
                className="w-full bg-[#0a0f1e] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Help Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bitcoin className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Pagos en Bitcoin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Conversión satoshi en tiempo real sin recargos bancarios ni tarjetas requeridas.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Voucher Criptográfico</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Firma ECDSA verificable on-chain, exportación a PDF y despacho a tu Gmail.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Seguimiento de Envíos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Despachos directos desde el almacén de los proveedores con código de tracking.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Garantía NexCoin.sol</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Resolución garantizada por contrato inteligente y Libro de Reclamaciones legal.
            </p>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white font-heading">Preguntas Frecuentes del Ecosistema</h2>
          
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/[0.08] bg-[#090d18] overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                        {faq.category}
                      </span>
                      <h4 className="text-sm font-bold text-white">{faq.q}</h4>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.04]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Still have questions? Contact Box */}
        <div className="p-8 rounded-2xl bg-[#0a1022] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-base font-bold text-white">¿No encontraste lo que buscabas?</h3>
            <p className="text-xs text-slate-400">
              Nuestro equipo de soporte técnico responde en menos de 2 horas los 365 días del año.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/servicio-al-cliente"
              className="px-5 py-3 bg-[#121a30] hover:bg-[#1a2646] border border-white/[0.1] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2"
            >
              <span>Canales de Contacto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="mailto:soporte@nexcoin.com"
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Escribir a Soporte</span>
            </a>
          </div>
        </div>

      </div>
    </StorePageLayout>
  );
};
