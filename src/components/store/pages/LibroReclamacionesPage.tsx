import React, { useState } from 'react';
import { StorePageLayout } from '../StorePageLayout';
import { CheckCircle2, Send, Printer, RotateCcw } from 'lucide-react';

export const LibroReclamacionesPage: React.FC = () => {
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [claimForm, setClaimForm] = useState({
    nombre: '',
    documento: '',
    email: '',
    telefono: '',
    direccion: '',
    tipo: 'Reclamo' as 'Reclamo' | 'Queja',
    monto: '',
    codigoOrden: '',
    detalle: '',
    pedido: '',
    acepta: false
  });

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimForm.acepta) {
      alert('Debes declarar la veracidad de los hechos para registrar tu hoja de reclamación.');
      return;
    }
    const generatedCode = 'HR-2026-' + Math.floor(100000 + Math.random() * 900000);
    setClaimCode(generatedCode);
    setClaimSubmitted(true);
  };

  return (
    <StorePageLayout categoryName="Servicio al cliente" pageTitle="Libro de reclamaciones">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-6 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono">
              Conforme a la Ley N° 29571
            </span>
            <span className="text-xs text-slate-400 font-mono">Hoja de Reclamación Virtual Oficial</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Libro de Reclamaciones Virtual
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Razón Social: <strong>NOVASATS TECHNOLOGIES S.A.C.</strong> • RUC: <strong>20608945123</strong>
            <br />
            Dirección Fiscal: Av. Javier Prado Este 4200, Santiago de Surco, Lima - Perú.
          </p>
        </div>

        {claimSubmitted ? (
          <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
              ¡Hoja de Reclamación Registrada con Éxito!
            </h3>
            <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] inline-block font-mono text-amber-400 text-lg font-bold">
              Código de Registro: {claimCode}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Hemos enviado una copia formal de esta hoja a tu correo <strong>{claimForm.email}</strong>. De acuerdo al Código de Protección y Defensa del Consumidor, recibirás una respuesta formal en un plazo no mayor a quince (15) días hábiles.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-white/[0.1] inline-flex items-center gap-2 transition"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimir Hoja de Reclamación</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setClaimSubmitted(false);
                  setClaimForm({
                    nombre: '',
                    documento: '',
                    email: '',
                    telefono: '',
                    direccion: '',
                    tipo: 'Reclamo',
                    monto: '',
                    codigoOrden: '',
                    detalle: '',
                    pedido: '',
                    acepta: false
                  });
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Registrar Otra Hoja</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleClaimSubmit} className="space-y-6">
            
            {/* Step 1: Consumidor */}
            <div className="p-6 rounded-2xl bg-[#080d1a] border border-white/[0.08] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                1. Identificación del Consumidor Reclamante
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nombre y Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carlos Ramírez Morales"
                    value={claimForm.nombre}
                    onChange={(e) => setClaimForm({ ...claimForm, nombre: e.target.value })}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">DNI / CE / Pasaporte *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 47852140"
                    value={claimForm.documento}
                    onChange={(e) => setClaimForm({ ...claimForm, documento: e.target.value })}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@ejemplo.com"
                    value={claimForm.email}
                    onChange={(e) => setClaimForm({ ...claimForm, email: e.target.value })}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Teléfono / Celular *</label>
                  <input
                    type="text"
                    required
                    placeholder="+51 987 654 321"
                    value={claimForm.telefono}
                    onChange={(e) => setClaimForm({ ...claimForm, telefono: e.target.value })}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Domicilio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Av. Los Pinos 340, Dpto 402, Lima"
                    value={claimForm.direccion}
                    onChange={(e) => setClaimForm({ ...claimForm, direccion: e.target.value })}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Bien Contratado */}
            <div className="p-6 rounded-2xl bg-[#080d1a] border border-white/[0.08] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                2. Identificación del Bien Contratado
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Monto Reclamado (USD / BTC)</label>
                  <input
                    type="text"
                    placeholder="Ej: $250.00 USD ó 0.0038 BTC"
                    value={claimForm.monto}
                    onChange={(e) => setClaimForm({ ...claimForm, monto: e.target.value })}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">N° de Orden o Voucher</label>
                  <input
                    type="text"
                    placeholder="Ej: VCH-2026-XXXX ó ORD-..."
                    value={claimForm.codigoOrden}
                    onChange={(e) => setClaimForm({ ...claimForm, codigoOrden: e.target.value })}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Reclamación */}
            <div className="p-6 rounded-2xl bg-[#080d1a] border border-white/[0.08] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                3. Detalle de la Reclamación y Pedido
              </h3>
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-2">Tipo de Registro *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition ${claimForm.tipo === 'Reclamo' ? 'bg-amber-500/10 border-amber-500 text-amber-300' : 'bg-[#060911] border-white/[0.1] text-slate-400'}`}>
                    <input
                      type="radio"
                      name="claimType"
                      checked={claimForm.tipo === 'Reclamo'}
                      onChange={() => setClaimForm({ ...claimForm, tipo: 'Reclamo' })}
                      className="accent-amber-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold block text-white">Reclamo</span>
                      <span className="text-[10px] text-slate-400">Disconformidad relacionada a los productos o servicios.</span>
                    </div>
                  </label>

                  <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition ${claimForm.tipo === 'Queja' ? 'bg-amber-500/10 border-amber-500 text-amber-300' : 'bg-[#060911] border-white/[0.1] text-slate-400'}`}>
                    <input
                      type="radio"
                      name="claimType"
                      checked={claimForm.tipo === 'Queja'}
                      onChange={() => setClaimForm({ ...claimForm, tipo: 'Queja' })}
                      className="accent-amber-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold block text-white">Queja</span>
                      <span className="text-[10px] text-slate-400">Malestar o descontento respecto a la atención al público.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Detalle de los Hechos *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe de manera detallada los hechos que fundamentan tu reclamación..."
                  value={claimForm.detalle}
                  onChange={(e) => setClaimForm({ ...claimForm, detalle: e.target.value })}
                  className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pedido Concreto del Consumidor *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Indica qué solución solicitas (ej: cambio de producto, reenvío o reembolso)..."
                  value={claimForm.pedido}
                  onChange={(e) => setClaimForm({ ...claimForm, pedido: e.target.value })}
                  className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={claimForm.acepta}
                    onChange={(e) => setClaimForm({ ...claimForm, acepta: e.target.checked })}
                    className="mt-0.5 accent-amber-500 w-4 h-4 rounded shrink-0"
                  />
                  <span className="text-[11px] text-slate-300 leading-snug">
                    Declaro bajo juramento que los datos consignados en la presente hoja de reclamación son verídicos y autorizo a NOVASATS TECHNOLOGIES S.A.C. a utilizarlos para dar respuesta formal conforme a ley.
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Hoja de Reclamación Virtual</span>
            </button>
          </form>
        )}

      </div>
    </StorePageLayout>
  );
};
