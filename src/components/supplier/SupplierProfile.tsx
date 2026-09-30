import React, { useState } from 'react';
import { SupplierLayout } from './SupplierLayout';
import { useSupplier } from '../../context/SupplierContext';
import { supabase } from '../../lib/supabaseClient';
import { Blobatar } from '../ui/blobatar';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  User,
  Building,
  Mail,
  Phone,
  Wallet,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  FileSpreadsheet,
  Lock,
  Unlock,
  Shuffle,
  Smile,
  Plus,
  Trash2,
  Check,
  Copy,
  ShieldCheck,
  Radio,
  Sliders,
  Layers,
  Palette,
  Eye,
  Zap
} from 'lucide-react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import {
  BLOBATAR_EXPRESSIONS,
  BLOBATAR_SHAPES,
  BLOBATAR_GLOWS,
  parseBlobatar,
  serializeBlobatar,
  getBlobatarAnimate
} from '../../lib/blobatarHelper';

export interface PayoutWalletItem {
  id: string;
  address: string;
  label: string;
  network: string;
  isPrimary: boolean;
  addedAt: string;
}

export const SupplierProfile: React.FC = () => {
  const navigate = useNavigate();
  const { supplier, refreshSupplier, logout } = useSupplier();

  // Danger zone: Delete Account states
  const [hasExportedBackup, setHasExportedBackup] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExportInventoryBackup = async () => {
    if (!supplier) return;
    setIsExportingBackup(true);
    setDeleteError(null);
    try {
      const { data: prods, error } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplier.id);

      if (error) throw error;

      const rows = (prods || []).map((p: any) => ({
        SKU: p.sku || 'N/A',
        Nombre: p.name,
        Descripción: p.description || '',
        Categoría: p.category,
        'Precio USD': p.price_usd,
        'Precio BTC': p.price_btc || 0,
        'Precio Original USD': p.original_price_usd || p.price_usd,
        'Descuento %': p.discount_percent || 0,
        Stock: p.stock,
        Estado: p.status,
        'Envío Gratis': p.free_shipping ? 'Sí' : 'No',
        'Tipo de Envío': p.shipping_type || 'standard',
        Destacado: p.is_featured ? 'Sí' : 'No',
        Tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
        'Fecha Creación': new Date(p.created_at).toLocaleString(),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Mensaje: 'Sin productos registrados' }]);
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
      
      const safeCompanyName = (supplier.company_name || 'Proveedor').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Copia_Seguridad_Inventario_NexCoin_${safeCompanyName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      setHasExportedBackup(true);
    } catch (err: any) {
      console.error('Error exporting backup:', err);
      setDeleteError('No se pudo generar la copia de seguridad. Por favor, reintenta.');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!supplier) return;
    if (!hasExportedBackup) {
      setDeleteError('Primero debes generar y descargar la copia de seguridad de tu inventario en Excel.');
      return;
    }
    if (confirmDeleteInput.trim() !== 'ELIMINAR CUENTA') {
      setDeleteError('Debes escribir exactamente "ELIMINAR CUENTA" para confirmar.');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      // 1. Delete all products of this supplier
      await supabase
        .from('products')
        .delete()
        .eq('supplier_id', supplier.id);

      // 2. Delete supplier account
      await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplier.id);

      // 3. Clear local storage records for this supplier
      localStorage.removeItem(`nexcoin_read_notifs_${supplier.id}`);
      localStorage.removeItem(`supplier_payout_wallets_${supplier.id}`);

      // 4. Logout session
      logout();

      // 5. Navigate to the farewell page
      navigate('/proveedores/cuenta-eliminada');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setDeleteError(err.message || 'Error al procesar la eliminación de la cuenta. Inténtalo nuevamente.');
      setIsDeletingAccount(false);
    }
  };

  const [companyName, setCompanyName] = useState(supplier?.company_name || '');
  const [contactName, setContactName] = useState(supplier?.contact_name || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [walletAddress, setWalletAddress] = useState(supplier?.wallet_address || '');
  
  // Custom Blobatar configuration parsed from supplier.avatar_url
  const initialBlob = parseBlobatar(supplier?.avatar_url, supplier?.company_name || 'NexCoin Supplier');
  const [avatarSeed, setAvatarSeed] = useState(initialBlob.seed);
  const [selectedExpression, setSelectedExpression] = useState(initialBlob.expressionKey);
  const [selectedShape, setSelectedShape] = useState(initialBlob.shapeKey);
  const [selectedGlow, setSelectedGlow] = useState(initialBlob.glowKey);
  const [animationMode, setAnimationMode] = useState<'hover' | 'always' | 'static'>(initialBlob.animMode);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reown AppKit connection
  const { open } = useAppKit();
  const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount();

  // Multi-wallet state
  const getInitialWallets = (): PayoutWalletItem[] => {
    if (!supplier) return [];
    try {
      const stored = localStorage.getItem(`supplier_payout_wallets_${supplier.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    const currentAddr = supplier.wallet_address?.trim();
    if (currentAddr) {
      return [
        {
          id: 'default-1',
          address: currentAddr,
          label: 'Billetera Principal de Recaudación',
          network: currentAddr.startsWith('0x') ? 'Ethereum / EVM' : 'Bitcoin Native',
          isPrimary: true,
          addedAt: new Date().toLocaleDateString(),
        }
      ];
    }
    return [];
  };

  const [wallets, setWallets] = useState<PayoutWalletItem[]>(getInitialWallets);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [newWalletNetwork, setNewWalletNetwork] = useState('Ethereum / EVM');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const persistWallets = (updatedWallets: PayoutWalletItem[]) => {
    if (supplier?.id) {
      localStorage.setItem(`supplier_payout_wallets_${supplier.id}`, JSON.stringify(updatedWallets));
    }
  };

  const handleSetPrimary = (id: string) => {
    const updated = wallets.map((w) => ({
      ...w,
      isPrimary: w.id === id,
    }));
    setWallets(updated);
    persistWallets(updated);
    const target = updated.find((w) => w.id === id);
    if (target) {
      setWalletAddress(target.address);
      setMessage({
        type: 'success',
        text: `La wallet "${target.label}" (${target.address.slice(0, 6)}...${target.address.slice(-4)}) ahora es la principal para recibir ventas. Recuerda pulsar Guardar.`,
      });
    }
  };

  const handleAddWallet = (addressToAdd?: string, labelToAdd?: string, networkToAdd?: string) => {
    const addr = (addressToAdd || newWalletAddress).trim();
    if (!addr) {
      setMessage({ type: 'error', text: 'Por favor ingresa una dirección de wallet válida.' });
      return;
    }

    if (wallets.some((w) => w.address.toLowerCase() === addr.toLowerCase())) {
      setMessage({ type: 'error', text: 'Esta dirección ya está configurada en tus billeteras.' });
      return;
    }

    const newEntry: PayoutWalletItem = {
      id: `w_${Date.now()}`,
      address: addr,
      label: (labelToAdd || newWalletLabel).trim() || `Billetera ${wallets.length + 1}`,
      network: networkToAdd || newWalletNetwork,
      isPrimary: wallets.length === 0,
      addedAt: new Date().toLocaleDateString(),
    };

    const updated = [...wallets, newEntry];
    setWallets(updated);
    persistWallets(updated);
    if (newEntry.isPrimary) {
      setWalletAddress(newEntry.address);
    }
    setNewWalletAddress('');
    setNewWalletLabel('');
    setMessage({
      type: 'success',
      text: `Wallet "${newEntry.label}" agregada exitosamente a tu lista de cobro.`,
    });
  };

  const handleDeleteWallet = (id: string) => {
    const target = wallets.find((w) => w.id === id);
    if (target?.isPrimary) {
      setMessage({
        type: 'error',
        text: 'No puedes eliminar la billetera principal. Primero marca otra como principal.',
      });
      return;
    }
    const updated = wallets.filter((w) => w.id !== id);
    setWallets(updated);
    persistWallets(updated);
    setMessage({
      type: 'success',
      text: 'Billetera secundaria eliminada de tu cuenta.',
    });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sampleNames = [
    'CryptoTitan Pro',
    'SatoshiForge',
    'CyberLedger Lab',
    'QuantumHodl',
    'BlockVanguard',
    'NexTech Hardware',
    'BitMatrix Studio',
    'AeroCold Wallet',
    'DeFiSentinel',
    'ZeroKnowledge Miner'
  ];

  const handleRandomSeed = () => {
    const random = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    setAvatarSeed(random);
  };

  const activeShape = BLOBATAR_SHAPES.find((s) => s.id === selectedShape) || BLOBATAR_SHAPES[1];
  const activeGlow = BLOBATAR_GLOWS.find((g) => g.id === selectedGlow) || BLOBATAR_GLOWS[0];
  const activeExpression = BLOBATAR_EXPRESSIONS[selectedExpression] || BLOBATAR_EXPRESSIONS.happy;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    if (!companyName.trim()) {
      setMessage({ type: 'error', text: 'El nombre de la empresa es obligatorio.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // Serialize full rich blobatar configuration
      const blobatarIdentifier = serializeBlobatar({
        seed: avatarSeed.trim() || companyName.trim(),
        expressionKey: selectedExpression,
        shapeKey: selectedShape,
        glowKey: selectedGlow,
        animMode: animationMode,
      });

      // Ensure active primary wallet matches walletAddress
      const primaryWallet = wallets.find((w) => w.isPrimary);
      const activePayoutAddress = primaryWallet?.address || walletAddress.trim();

      const { error } = await supabase
        .from('suppliers')
        .update({
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          phone: phone.trim(),
          wallet_address: activePayoutAddress,
          avatar_url: blobatarIdentifier,
        })
        .eq('id', supplier.id);

      if (error) throw error;

      persistWallets(wallets);
      await refreshSupplier();
      setMessage({
        type: 'success',
        text: '¡Perfil, icono Blobatar personalizado y configuración de billeteras guardados con éxito!',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Error al guardar los cambios en el perfil.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SupplierLayout
      title="Perfil de Proveedor & Personalizador de Icono"
      subtitle="Configura tu identidad comercial, personaliza tu Blobatar animado y gestiona tus billeteras de recaudación"
    >
      <div className="w-full max-w-full space-y-8">
        
        {/* Toast Feedback */}
        {message && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all shadow-xl animate-fade-in ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8 w-full max-w-full">

          {/* SECTION 1: PERSONALIZADOR PROFESIONAL DE BLOBATAR */}
          <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 w-full">
            
            {/* Header with Title and Save Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Personalizador de Icono Blobatar</span>
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow">
                      Edición Pro
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifica expresiones faciales, siluetas, brillos fluorescentes y animaciones interactivas en tiempo real
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>

            {/* LIVE PREVIEW HERO BANNER */}
            <div className="bg-[#060911] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Main Large Blobatar Display */}
              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                <div className="relative group">
                  <Blobatar
                    name={avatarSeed || 'NexCoin'}
                    blobatar={{
                      expression: activeExpression.expr,
                      animate: getBlobatarAnimate(animationMode),
                    }}
                    className={`w-28 h-28 ${activeShape.class} border-2 ${activeGlow.border} ${activeGlow.glow} transition-all duration-300 transform group-hover:scale-105 bg-slate-900/60`}
                  />
                  <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-black/80 border border-white/20 rounded-full text-xs shadow-lg backdrop-blur">
                    {activeExpression.icon}
                  </div>
                </div>

                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-base font-black text-white">{avatarSeed || companyName || 'NexCoin Supplier'}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Semilla Activa
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Expresión: <span className="text-white font-bold">{activeExpression.label}</span> • Forma: <span className="text-white font-bold">{activeShape.label}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Efecto: <span className="text-amber-400 font-semibold">{activeGlow.label}</span> • Animación: <span className="text-slate-300 font-semibold">{animationMode === 'hover' ? 'Interactivo (Hover)' : animationMode === 'always' ? 'Continuo' : 'Estático'}</span>
                  </p>
                </div>
              </div>

              {/* Multi-Context Previews */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start xl:justify-end gap-5 pt-4 xl:pt-0 border-t xl:border-t-0 xl:border-l border-white/[0.08] xl:pl-8 relative z-10">
                
                {/* Sidebar context */}
                <div className="flex flex-col items-center gap-1.5 bg-[#0e1424] p-3 rounded-2xl border border-white/[0.06] text-center min-w-[90px]">
                  <Blobatar
                    name={avatarSeed || 'NexCoin'}
                    blobatar={{ expression: activeExpression.expr, animate: getBlobatarAnimate(animationMode) }}
                    className={`w-12 h-12 ${activeShape.class} border ${activeGlow.border}`}
                  />
                  <span className="text-[10px] font-bold text-slate-300">Barra Lateral</span>
                  <span className="text-[9px] text-slate-500 font-mono">48 × 48 px</span>
                </div>

                {/* Product Detail context */}
                <div className="flex flex-col items-center gap-1.5 bg-[#0e1424] p-3 rounded-2xl border border-white/[0.06] text-center min-w-[90px]">
                  <Blobatar
                    name={avatarSeed || 'NexCoin'}
                    blobatar={{ expression: activeExpression.expr, animate: getBlobatarAnimate(animationMode) }}
                    className={`w-10 h-10 ${activeShape.class} border ${activeGlow.border}`}
                  />
                  <span className="text-[10px] font-bold text-slate-300">Ficha Producto</span>
                  <span className="text-[9px] text-slate-500 font-mono">40 × 40 px</span>
                </div>

                {/* Voucher context */}
                <div className="flex flex-col items-center gap-1.5 bg-[#0e1424] p-3 rounded-2xl border border-white/[0.06] text-center min-w-[90px]">
                  <Blobatar
                    name={avatarSeed || 'NexCoin'}
                    blobatar={{ expression: activeExpression.expr, animate: getBlobatarAnimate(animationMode) }}
                    className={`w-8 h-8 ${activeShape.class} border ${activeGlow.border}`}
                  />
                  <span className="text-[10px] font-bold text-slate-300">Voucher</span>
                  <span className="text-[9px] text-slate-500 font-mono">32 × 32 px</span>
                </div>

                {/* Store Catalog context */}
                <div className="flex flex-col items-center gap-1.5 bg-[#0e1424] p-3 rounded-2xl border border-white/[0.06] text-center min-w-[90px]">
                  <Blobatar
                    name={avatarSeed || 'NexCoin'}
                    blobatar={{ expression: activeExpression.expr, animate: getBlobatarAnimate(animationMode) }}
                    className={`w-6 h-6 ${activeShape.class} border border-white/20`}
                  />
                  <span className="text-[10px] font-bold text-slate-300">Catálogo</span>
                  <span className="text-[9px] text-slate-500 font-mono">24 × 24 px</span>
                </div>

              </div>
            </div>

            {/* STEP 1: SEED & NAME INPUT */}
            <div className="space-y-3 bg-[#060911] p-5 rounded-2xl border border-white/[0.06]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span>Paso 1: Semilla Base del Icono (Texto Generativo)</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Cada palabra genera una paleta de colores y rasgos faciales completamente únicos
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Smile className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={avatarSeed}
                    onChange={(e) => setAvatarSeed(e.target.value)}
                    placeholder="Escribe tu marca o cualquier palabra..."
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRandomSeed}
                  className="px-4 py-2.5 bg-[#0e1424] hover:bg-[#161f38] text-amber-400 hover:text-amber-300 border border-white/[0.08] hover:border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 shadow-sm"
                  title="Generar nombre aleatorio temático Web3"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Aleatorio</span>
                </button>
              </div>
            </div>

            {/* STEP 2: FACIAL EXPRESSIONS SELECTOR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span>Paso 2: Expresión Emocional ({Object.keys(BLOBATAR_EXPRESSIONS).length} Variantes)</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Selecciona la actitud que mejor represente a tu marca
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(BLOBATAR_EXPRESSIONS).map(([key, item]) => {
                  const isSelected = selectedExpression === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedExpression(key)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-3 group relative overflow-hidden ${
                        isSelected
                          ? 'bg-amber-500/[0.08] border-amber-500/60 ring-2 ring-amber-500/30'
                          : 'bg-[#060911] border-white/[0.06] hover:border-white/[0.15] hover:bg-[#0c1222]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-2xl">{item.icon}</span>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-slate-500" />
                        )}
                      </div>

                      <div>
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3 & STEP 4: SHAPE & GLOW COLOR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* STEP 3: SHAPE */}
              <div className="space-y-3 bg-[#060911] p-5 rounded-2xl border border-white/[0.06]">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Paso 3: Silueta & Geometría del Marco</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {BLOBATAR_SHAPES.map((shape) => {
                    const isSelected = selectedShape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setSelectedShape(shape.id)}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition text-left ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                            : 'bg-[#0a0f1d] border-white/[0.08] hover:border-white/[0.15]'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 ${shape.class} border-2 ${
                            isSelected ? 'border-amber-400 bg-amber-500/20' : 'border-slate-600 bg-slate-800'
                          } shrink-0`}
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                            {shape.label}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{shape.class}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4: GLOW & COLOR */}
              <div className="space-y-3 bg-[#060911] p-5 rounded-2xl border border-white/[0.06]">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-500" />
                  <span>Paso 4: Tono de Acento & Brillo Neón (Glow)</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {BLOBATAR_GLOWS.map((glow) => {
                    const isSelected = selectedGlow === glow.id;
                    return (
                      <button
                        key={glow.id}
                        type="button"
                        onClick={() => setSelectedGlow(glow.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition text-left ${
                          isSelected
                            ? 'bg-white/[0.06] border-white/40 ring-1 ring-white/20'
                            : 'bg-[#0a0f1d] border-white/[0.08] hover:border-white/[0.15]'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: glow.color }}
                        />
                        <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {glow.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* STEP 5: ANIMATION BEHAVIOR */}
            <div className="space-y-3 bg-[#060911] p-5 rounded-2xl border border-white/[0.06]">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Paso 5: Comportamiento de Movimiento & Animación</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAnimationMode('hover')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                    animationMode === 'hover'
                      ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                      : 'bg-[#0a0f1d] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${animationMode === 'hover' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${animationMode === 'hover' ? 'text-amber-300' : 'text-white'}`}>
                      Al pasar el mouse (Hover)
                    </p>
                    <p className="text-[10px] text-slate-400">Reacciona al interactuar con el cursor</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAnimationMode('always')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                    animationMode === 'always'
                      ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                      : 'bg-[#0a0f1d] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${animationMode === 'always' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${animationMode === 'always' ? 'text-amber-300' : 'text-white'}`}>
                      Continuo (Always)
                    </p>
                    <p className="text-[10px] text-slate-400">Movimiento dinámico permanente</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAnimationMode('static')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                    animationMode === 'static'
                      ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                      : 'bg-[#0a0f1d] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${animationMode === 'static' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${animationMode === 'static' ? 'text-amber-300' : 'text-white'}`}>
                      Estático (Static)
                    </p>
                    <p className="text-[10px] text-slate-400">Fijo sin animación SVG</p>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* SECTION 2: DATOS COMERCIALES DE LA EMPRESA */}
          <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 w-full">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.08] pb-4">
              <Building className="w-4 h-4 text-amber-500" />
              <span>Datos Comerciales de la Empresa / Marca</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de la Empresa o Marca *
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Persona de Contacto
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico (Registrado en Supabase)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    disabled
                    value={supplier?.email || ''}
                    className="w-full bg-[#060911]/50 border border-white/[0.06] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teléfono / WhatsApp de Soporte
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Billetera Activa para recibir pagos de ventas
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    Sincronizada con Multi-Wallets
                  </span>
                </div>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x... o bc1q..."
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Esta es la billetera actual donde se transfieren los fondos de tus ventas. Puedes alternar o añadir más billeteras en la sección inferior.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: GESTIÓN DE MÚLTIPLES BILLETERAS DE COBRO (MULTI-WALLET PAYOUTS) */}
          <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Billeteras de Cobro & WalletConnect</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Multi-Wallet P2P
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configura más de una wallet donde deseas recibir el dinero de las ventas de tus productos.
                  </p>
                </div>
              </div>

              {/* Reown AppKit Connect Button embedded in profile */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => open()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 active:scale-95"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isAppKitConnected && appKitAddress ? `${appKitAddress.slice(0, 6)}...${appKitAddress.slice(-4)}` : 'Conectar con WalletConnect'}</span>
                </button>
              </div>
            </div>

            {/* If wallet is connected via Reown AppKit, offer quick 1-click addition */}
            {isAppKitConnected && appKitAddress && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">
                      Wallet Conectada vía Reown AppKit / WalletConnect
                    </span>
                    <span className="text-[11px] font-mono text-slate-300">
                      {appKitAddress}
                    </span>
                  </div>
                </div>

                {!wallets.some((w) => w.address.toLowerCase() === appKitAddress.toLowerCase()) ? (
                  <button
                    type="button"
                    onClick={() => handleAddWallet(appKitAddress, 'Wallet Conectada (Web3)', 'Ethereum / EVM')}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar a mis Billeteras de Cobro</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ya está en tu lista
                  </span>
                )}
              </div>
            )}

            {/* List of configured payout wallets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Tus Billeteras Configuradas ({wallets.length})</span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  La billetera marcada como "Principal" recibirá las liquidaciones directas
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {wallets.map((w) => (
                  <div
                    key={w.id}
                    className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      w.isPrimary
                        ? 'bg-amber-500/[0.06] border-amber-500/40 ring-1 ring-amber-500/20'
                        : 'bg-[#060911] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white">{w.label}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#0e1424] text-slate-300 border border-white/[0.08]">
                          {w.network}
                        </span>
                        {w.isPrimary && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black flex items-center gap-1 shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" /> Principal para Cobro
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-300 bg-[#060911] px-2.5 py-1 rounded-lg border border-white/[0.08] truncate max-w-xs sm:max-w-md">
                          {w.address}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(w.id, w.address)}
                          title="Copiar dirección"
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-[#0e1424] rounded-lg transition"
                        >
                          {copiedId === w.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {!w.isPrimary ? (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(w.id)}
                          className="px-3 py-1.5 bg-[#0e1424] hover:bg-amber-500 hover:text-black text-slate-300 rounded-xl text-xs font-bold transition border border-white/[0.08] flex items-center gap-1.5"
                        >
                          <Radio className="w-3 h-3" />
                          <span>Hacer Principal</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-amber-400 font-bold px-3 py-1.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                          Activa para Ventas
                        </span>
                      )}

                      {!w.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWallet(w.id)}
                          title="Eliminar wallet secundaria"
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form to add a new wallet manually */}
            <div className="p-5 rounded-2xl bg-[#060911] border border-white/[0.06] space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Agregar Otra Billetera Manualmente</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Etiqueta / Nombre
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Cold Storage BTC, Binance"
                    value={newWalletLabel}
                    onChange={(e) => setNewWalletLabel(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Red Blockchain
                  </label>
                  <select
                    value={newWalletNetwork}
                    onChange={(e) => setNewWalletNetwork(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Ethereum / EVM">Ethereum / EVM (0x...)</option>
                    <option value="Polygon">Polygon (MATIC)</option>
                    <option value="Arbitrum">Arbitrum One</option>
                    <option value="Base">Base Network</option>
                    <option value="Optimism">Optimism</option>
                    <option value="Bitcoin Native">Bitcoin Native (bc1q / 1...)</option>
                    <option value="BNB Chain">BNB Smart Chain</option>
                  </select>
                </div>

                <div className="sm:col-span-1 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => handleAddWallet()}
                    className="w-full py-2 bg-[#0e1424] hover:bg-[#161f38] border border-white/[0.08] hover:border-amber-500/40 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Añadir a la Lista</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Dirección de la Billetera *
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="0x... o bc1q..."
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Informational security note */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5 text-xs text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Los pagos de los compradores en la tienda se liquidarán de forma no custodial y transparente directo a tu billetera principal activa.
              </span>
            </div>
          </div>

          {/* Bottom Save Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/20 transition disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando en Supabase...' : 'Guardar Perfil & Blobatar'}</span>
            </button>
          </div>

        </form>

        {/* Zona de Peligro: Eliminar Cuenta de Proveedor */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-[#13070b] border-2 border-rose-500/30 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                Zona de Peligro: Eliminar Cuenta de Proveedor
              </h3>
              <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                Esta acción es destructiva e irreversible. Si eliminas tu cuenta, todos tus productos activos y archivados se eliminarán inmediatamente del catálogo de NexCoin Marketplace.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/20 text-xs text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-200">
              <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Requisito Obligatorio de Seguridad</span>
            </div>
            <p className="leading-relaxed">
              Para no perder el inventario de tus productos ni las referencias de tus precios y SKUs, el sistema exige que hagas una copia de seguridad en Excel antes de habilitar el botón de eliminación.
            </p>
          </div>

          {deleteError && (
            <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Paso 1: Generar Copia de Seguridad */}
            <div className={`p-5 rounded-2xl border transition ${
              hasExportedBackup 
                ? 'bg-emerald-950/30 border-emerald-500/40' 
                : 'bg-white/[0.02] border-white/[0.08]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400">
                  Paso 1: Copia de Respaldo
                </span>
                {hasExportedBackup && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Copia Generada
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">
                Generar Inventario de Productos
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Descarga una hoja de cálculo Excel completa con todos tus productos, precios, stocks y detalles antes de continuar.
              </p>
              <button
                type="button"
                onClick={handleExportInventoryBackup}
                disabled={isExportingBackup}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>
                  {isExportingBackup 
                    ? 'Generando Archivo Excel...' 
                    : hasExportedBackup 
                    ? 'Descargar Copia Nuevamente (Excel)' 
                    : 'Generar Inventario (Excel)'}
                </span>
              </button>
            </div>

            {/* Paso 2: Confirmación y Eliminación */}
            <div className={`p-5 rounded-2xl border transition ${
              !hasExportedBackup
                ? 'opacity-40 pointer-events-none bg-white/[0.01] border-white/[0.05]'
                : 'bg-white/[0.02] border-rose-500/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400">
                  Paso 2: Confirmación Final
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                  {hasExportedBackup ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {hasExportedBackup ? 'Desbloqueado' : 'Bloqueado'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">
                Escribe "ELIMINAR CUENTA"
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Para confirmar la eliminación definitiva e irreversible de la cuenta y los productos:
              </p>
              
              <input
                type="text"
                disabled={!hasExportedBackup || isDeletingAccount}
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                placeholder="Escribe ELIMINAR CUENTA"
                className="w-full bg-[#060911] border border-rose-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500 mb-3"
              />

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!hasExportedBackup || confirmDeleteInput.trim() !== 'ELIMINAR CUENTA' || isDeletingAccount}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 transition disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isDeletingAccount ? 'Eliminando Cuenta y Catálogo...' : 'Eliminar Cuenta Definitivamente'}
                </span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </SupplierLayout>
  );
};
