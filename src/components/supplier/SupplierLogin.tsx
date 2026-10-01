import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupplier } from '../../context/SupplierContext';
import { Blobatar } from '../ui/blobatar';
import {
  Bitcoin,
  Store,
  Lock,
  Mail,
  Building,
  User,
  Phone,
  Wallet,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

export const SupplierLogin: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { open } = useAppKit();
  const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount();
  const { supplier, login, register } = useSupplier();
  const navigate = useNavigate();

  // If already authenticated via cookies, redirect straight to dashboard
  React.useEffect(() => {
    if (supplier) {
      navigate('/proveedores/dashboard', { replace: true });
    }
  }, [supplier, navigate]);

  if (supplier) {
    return (
      <div className="min-h-screen bg-[#060911] flex items-center justify-center text-amber-500">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          <span className="text-xs text-slate-400 font-mono">Redirigiendo a Portal Proveedores...</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (isRegister) {
      if (!companyName.trim() || !email.trim() || !password) {
        setError('Por favor completa todos los campos obligatorios.');
        setIsSubmitting(false);
        return;
      }

      if (!walletAddress.trim()) {
        setError('Por favor conecta o ingresa tu dirección de billetera real para recibir pagos.');
        setIsSubmitting(false);
        return;
      }

      const res = await register({
        company_name: companyName.trim(),
        contact_name: contactName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        wallet_address: walletAddress.trim(),
      });

      if (res.success) {
        navigate('/proveedores/dashboard');
      } else {
        setError(res.error || 'Error al crear la cuenta de proveedor.');
      }
    } else {
      if (!email.trim() || !password) {
        setError('Ingresa tu email y contraseña.');
        setIsSubmitting(false);
        return;
      }

      const res = await login(email.trim(), password);
      if (res.success) {
        navigate('/proveedores/dashboard');
      } else {
        setError(res.error || 'Credenciales inválidas.');
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#060911] text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-amber-500 selection:text-black overflow-x-hidden">
      
      {/* LEFT COLUMN: Hero & Visual Showcase (Occupies full left side on desktop) */}
      <div className="lg:w-1/2 xl:w-7/12 relative bg-[#090d18] border-b lg:border-b-0 lg:border-r border-white/[0.08] p-5 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Top Header / Branding */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition">
              <Bitcoin className="w-7 h-7 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1 font-heading">
                Nex<span className="text-amber-500">Coin</span>
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block -mt-1">
                Ecosistema de Comercio Descentralizado
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 mt-5 lg:mt-6 mb-5 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Portal Exclusivo para Proveedores & Marcas
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-heading leading-tight">
            Vende tus productos a nivel global con liquidación <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">Bitcoin</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Gestiona tu catálogo con modales de alta velocidad, controla inventario en tiempo real, emite comprobantes firmados criptográficamente con el Smart Contract NovaSats.sol y analiza tus métricas comerciales.
          </p>

          {/* Grid of Perks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded-2xl bg-[#0f1628]/80 border border-white/[0.08] backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wide text-white">Stock & Modales Ágiles</h3>
              <p className="text-[11px] text-slate-400 mt-1">Crea, edita o reactiva productos con un solo clic sin recargar la página.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1628]/80 border border-white/[0.08] backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wide text-white">Firma Criptográfica</h3>
              <p className="text-[11px] text-slate-400 mt-1">Vouchers respaldados por hash ECDSA y Smart Contract NovaSats.sol v2.0.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1628]/80 border border-white/[0.08] backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-3">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wide text-white">Reportes en Múltiples Páginas</h3>
              <p className="text-[11px] text-slate-400 mt-1">Ventas detalladas, rotación de inventarios y cartera de clientes auditables.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1628]/80 border border-white/[0.08] backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wide text-white">Avatares Blobatar</h3>
              <p className="text-[11px] text-slate-400 mt-1">Personaliza la identidad visual de tu marca con avatares procedurales Web3.</p>
            </div>
          </div>

          {/* Supplier Community Preview */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <Blobatar name="Satoshi" className="w-8 h-8 rounded-full border-2 border-slate-900" />
                <Blobatar name="BitVendor" className="w-8 h-8 rounded-full border-2 border-slate-900" />
                <Blobatar name="CryptoGear" className="w-8 h-8 rounded-full border-2 border-slate-900" />
                <Blobatar name="NexStore" className="w-8 h-8 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Comunidad de Proveedores Verificados</p>
                <p className="text-[11px] text-slate-400">Transacciones descentralizadas on-chain</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-amber-400">100% P2P</span>
              <p className="text-[10px] text-slate-500">Non-custodial</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar on Hero */}
        <div className="relative z-10 pt-3.5 mt-2 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-amber-400 transition font-semibold">
            <Store className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </Link>
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <span>NovaSats.sol</span>
            <span>•</span>
            <span>On-Chain Verificado</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Full Height Interactive Form (Occupies full right side) */}
      <div className="lg:w-1/2 xl:w-5/12 bg-[#060911] p-4 sm:p-8 lg:p-12 flex flex-col justify-center min-h-screen">
        
        <div className="w-full max-w-xl mx-auto space-y-6">
          
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                Acceso Corporativo
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                Base de Datos Online
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 font-heading">
              {isRegister ? 'Registrar Nueva Empresa' : 'Acceso al Dashboard'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isRegister
                ? 'Empieza a publicar productos y recibir pagos en Bitcoin hoy mismo.'
                : 'Ingresa tus credenciales para administrar tus ventas y stock.'}
            </p>
          </div>

          {/* Form Box */}
          <div className="bg-[#0b1020] border border-white/[0.08] rounded-3xl p-5 sm:p-8 shadow-2xl relative">
            
            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/[0.06] rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition ${
                  !isRegister
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition ${
                  isRegister
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Registrar Proveedor
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nombre de la Empresa o Marca *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Ej: Cryptowear Labs Inc"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-[#070b14] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Contacto Responsable
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Ej: Roberto Gómez"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full bg-[#070b14] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Teléfono / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="+51 987 654 321"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-[#070b14] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* WalletConnect / Reown AppKit section */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        Billetera de Cobro (WalletConnect / EVM / BTC)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Reown AppKit</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                      <div className="text-xs">
                        <span className="text-slate-400 block text-[11px]">Conectar con WalletConnect:</span>
                        <span className="font-mono text-[11px] text-slate-200">
                          {isAppKitConnected && appKitAddress ? `${appKitAddress.slice(0, 6)}...${appKitAddress.slice(-4)}` : 'No conectada'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => open()}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>{isAppKitConnected && appKitAddress ? 'Cambiar Wallet' : 'Conectar Wallet'}</span>
                      </button>
                    </div>

                    {isAppKitConnected && appKitAddress && walletAddress !== appKitAddress && (
                      <button
                        type="button"
                        onClick={() => setWalletAddress(appKitAddress)}
                        className="w-full py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Usar Wallet Conectada ({appKitAddress.slice(0, 6)}...{appKitAddress.slice(-4)})</span>
                      </button>
                    )}

                    <div className="relative">
                      <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="0x... o bc1q... (o pega tu dirección)"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="w-full bg-[#070b14] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono transition"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Conecta tu wallet real mediante WalletConnect / Reown AppKit o ingresa tu dirección de cobro directamente.
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="proveedor@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#070b14] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Contraseña de Seguridad *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#070b14] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                <span>{isRegister ? 'Registrar e Ingresar al Portal' : 'Iniciar Sesión en el Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Autenticación Criptográfica SSL</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">v2.4.0 • On-Chain</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
