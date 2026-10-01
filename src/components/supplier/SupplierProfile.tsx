import React, { useState, useEffect } from 'react';
import { SupplierLayout } from './SupplierLayout';
import { useSupplier } from '../../context/SupplierContext';
import { supabase } from '../../lib/supabaseClient';
import { Blobatar } from '../ui/blobatar';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Key,
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
  EyeOff,
  Zap,
  Receipt,
  BadgeCheck,
  Award,
  Globe,
  FileText,
  MapPin,
  ExternalLink,
  X,
  Share2,
  MessageSquare,
  Store
} from 'lucide-react';
import {
  fetchSupplierKycFiscal,
  saveSupplierKycFiscal,
  SupplierKycFiscal,
  DEFAULT_KYC_FISCAL,
  fetchSupplierCommercialProfile,
  saveSupplierCommercialProfile,
  SupplierCommercialProfile,
  DEFAULT_COMMERCIAL_PROFILE,
  fetchSupplierWallets,
  saveSupplierWallets,
  fetchSupplierVoucherConfig,
  saveSupplierVoucherConfig,
  changeSupplierPassword
} from '../../lib/supplierDatabaseService';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import {
  BLOBATAR_EXPRESSIONS,
  BLOBATAR_SHAPES,
  BLOBATAR_GLOWS,
  parseBlobatar,
  serializeBlobatar,
  getBlobatarAnimate
} from '../../lib/blobatarHelper';
import {
  getSupplierVoucherConfig,
  setSupplierVoucherConfig,
  SupplierVoucherConfig
} from '../../lib/voucherConfigHelper';

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
      const filename = `Copia_Seguridad_Inventario_NovaSats_${safeCompanyName}_${new Date().toISOString().split('T')[0]}.xlsx`;
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

      // 2. Delete all related subtable records in Supabase
      await Promise.allSettled([
        supabase.from('supplier_wallets').delete().eq('supplier_id', supplier.id),
        supabase.from('supplier_kyc_fiscal').delete().eq('supplier_id', supplier.id),
        supabase.from('supplier_commercial_profiles').delete().eq('supplier_id', supplier.id),
        supabase.from('supplier_voucher_configs').delete().eq('supplier_id', supplier.id),
        supabase.from('supplier_notifications_read').delete().eq('supplier_id', supplier.id),
      ]);

      // 3. Delete supplier account from Supabase
      await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplier.id);

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
  const [walletAddress, setWalletAddress] = useState(supplier?.wallet_address || '');
  
  // Custom Blobatar configuration parsed from supplier.avatar_url
  const initialBlob = parseBlobatar(supplier?.avatar_url, supplier?.company_name || 'NovaSats Supplier');
  const [initialBlobState, setInitialBlobState] = useState(initialBlob);
  const [avatarSeed, setAvatarSeed] = useState(initialBlob.seed);
  const [selectedExpression, setSelectedExpression] = useState(initialBlob.expressionKey);
  const [selectedShape, setSelectedShape] = useState(initialBlob.shapeKey);
  const [selectedGlow, setSelectedGlow] = useState(initialBlob.glowKey);
  const [animationMode, setAnimationMode] = useState<'hover' | 'always' | 'static'>(initialBlob.animMode);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab navigation state synced with ?filtro= and ?sub=
  type ProfileTab = 'identidad' | 'billeteras' | 'verificacion' | 'vouchers' | 'seguridad';
  type VerifSubTab = 'fiscal' | 'comercial';

  const [searchParams, setSearchParams] = useSearchParams();
  const currentFilter = searchParams.get('filtro') as ProfileTab | null;
  const currentSub = (searchParams.get('sub') || searchParams.get('seccion') || searchParams.get('tipo') || '').toLowerCase();
  const validTabs: ProfileTab[] = ['identidad', 'billeteras', 'verificacion', 'vouchers', 'seguridad'];
  const activeTab: ProfileTab = (currentFilter && validTabs.includes(currentFilter)) ? currentFilter : 'identidad';

  // Sub-view toggle inside Tab 3 (Datos Fiscales & Comerciales)
  // Default is 'comercial' (2. Datos Comerciales de la Empresa / Marca) as requested
  const verifSubTab: VerifSubTab = currentSub === 'fiscal' ? 'fiscal' : 'comercial';

  const handleTabChange = (tab: ProfileTab, sub?: VerifSubTab) => {
    if (tab === 'verificacion') {
      const targetSub = sub || verifSubTab || 'comercial';
      setSearchParams({ filtro: 'verificacion', sub: targetSub });
    } else {
      setSearchParams({ filtro: tab });
    }
  };

  const handleSubTabChange = (sub: VerifSubTab) => {
    setSearchParams({ filtro: 'verificacion', sub });
  };

  useEffect(() => {
    if (!currentFilter || !validTabs.includes(currentFilter)) {
      setSearchParams({ filtro: 'identidad' }, { replace: true });
    } else if (currentFilter === 'verificacion' && !currentSub) {
      setSearchParams({ filtro: 'verificacion', sub: 'comercial' }, { replace: true });
    }
  }, [currentFilter, currentSub, setSearchParams]);

  // Modal state for adding a wallet manually
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);

  // 1. KYC Fiscal State (Table: supplier_kyc_fiscal in Supabase)
  const [kycFiscal, setKycFiscal] = useState<SupplierKycFiscal>({
    supplier_id: supplier?.id || '',
    legal_name: supplier?.company_name || DEFAULT_KYC_FISCAL.legal_name,
    tax_id: DEFAULT_KYC_FISCAL.tax_id,
    country: DEFAULT_KYC_FISCAL.country,
    business_address: DEFAULT_KYC_FISCAL.business_address,
    legal_representative_name: DEFAULT_KYC_FISCAL.legal_representative_name,
    legal_representative_id_doc: DEFAULT_KYC_FISCAL.legal_representative_id_doc,
    tax_resolution: DEFAULT_KYC_FISCAL.tax_resolution,
    official_receipt_type: DEFAULT_KYC_FISCAL.official_receipt_type,
    fiscal_email: supplier?.email || DEFAULT_KYC_FISCAL.fiscal_email,
    fiscal_phone: supplier?.phone || DEFAULT_KYC_FISCAL.fiscal_phone,
    is_verified: false,
    terms_accepted: false,
    verified_at: null,
    verification_hash: null,
  });
  const [initialKycFiscal, setInitialKycFiscal] = useState<SupplierKycFiscal>(kycFiscal);
  const [isSavingKyc, setIsSavingKyc] = useState(false);

  // 2. Commercial Profile State (Table: supplier_commercial_profiles in Supabase)
  const [commercialProfile, setCommercialProfile] = useState<SupplierCommercialProfile>({
    supplier_id: supplier?.id || '',
    brand_name: supplier?.company_name || DEFAULT_COMMERCIAL_PROFILE.brand_name,
    commercial_activity: DEFAULT_COMMERCIAL_PROFILE.commercial_activity,
    website_url: DEFAULT_COMMERCIAL_PROFILE.website_url,
    support_email: supplier?.email || DEFAULT_COMMERCIAL_PROFILE.support_email,
    customer_phone: supplier?.phone || DEFAULT_COMMERCIAL_PROFILE.customer_phone,
    whatsapp_number: supplier?.phone || DEFAULT_COMMERCIAL_PROFILE.whatsapp_number,
    commercial_address: DEFAULT_COMMERCIAL_PROFILE.commercial_address,
    social_twitter: DEFAULT_COMMERCIAL_PROFILE.social_twitter,
    social_telegram: DEFAULT_COMMERCIAL_PROFILE.social_telegram,
    social_discord: DEFAULT_COMMERCIAL_PROFILE.social_discord,
    commercial_description: DEFAULT_COMMERCIAL_PROFILE.commercial_description,
  });
  const [initialCommercialProfile, setInitialCommercialProfile] = useState<SupplierCommercialProfile>(commercialProfile);
  const [isSavingCommercial, setIsSavingCommercial] = useState(false);


  // 3. Password Change in Tab 5 (Zona de Seguridad)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isKycDirty = JSON.stringify(kycFiscal) !== JSON.stringify(initialKycFiscal);

  // 4. Voucher formats configuration for customers
  const [voucherConfig, setVoucherConfig] = useState<SupplierVoucherConfig>(() =>
    getSupplierVoucherConfig(supplier?.id)
  );
  const [initialVoucherConfig, setInitialVoucherConfig] = useState<SupplierVoucherConfig>(() =>
    getSupplierVoucherConfig(supplier?.id)
  );

  const isVoucherDirty =
    voucherConfig.allow80mm !== initialVoucherConfig.allow80mm ||
    voucherConfig.allowDigital !== initialVoucherConfig.allowDigital;

  // Reown AppKit connection
  const { open } = useAppKit();
  const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount();

  // Multi-wallet state initialized from Supabase / supplier account
  const getInitialWallets = (): PayoutWalletItem[] => {
    if (!supplier) return [];
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
  const [initialWalletsJson, setInitialWalletsJson] = useState<string>(() => JSON.stringify(getInitialWallets()));
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [newWalletNetwork, setNewWalletNetwork] = useState('Ethereum / EVM');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load all supplier data from Supabase on mount (100% Relational Database, Zero localStorage)
  useEffect(() => {
    if (!supplier?.id) return;
    let isSubscribed = true;

    (async () => {
      try {
        const [fiscalRes, commRes, walletsRes, voucherRes] = await Promise.all([
          fetchSupplierKycFiscal(supplier.id),
          fetchSupplierCommercialProfile(supplier.id),
          fetchSupplierWallets(supplier.id),
          fetchSupplierVoucherConfig(supplier.id),
        ]);

        if (!isSubscribed) return;

        if (fiscalRes) {
          setKycFiscal(fiscalRes);
          setInitialKycFiscal(fiscalRes);
        }
        if (commRes) {
          setCommercialProfile(commRes);
          setInitialCommercialProfile(commRes);
        }
        if (walletsRes && walletsRes.length > 0) {
          const mappedWallets: PayoutWalletItem[] = walletsRes.map((w) => ({
            id: w.id,
            address: w.address,
            label: w.label,
            network: w.network,
            isPrimary: w.is_primary,
            addedAt: w.added_at ? new Date(w.added_at).toLocaleDateString() : new Date().toLocaleDateString(),
          }));
          setWallets(mappedWallets);
          setInitialWalletsJson(JSON.stringify(mappedWallets));
        }
        if (voucherRes) {
          const cfg: SupplierVoucherConfig = {
            allow80mm: voucherRes.allow_80mm,
            allowDigital: voucherRes.allow_digital,
          };
          setVoucherConfig(cfg);
          setInitialVoucherConfig(cfg);
          setSupplierVoucherConfig(supplier.id, cfg);
        }
      } catch (err) {
        console.error('Error fetching supplier data from Supabase:', err);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [supplier?.id]);

  const [initialContactName, setInitialContactName] = useState(supplier?.contact_name || '');
  const initialWalletAddress = supplier?.wallet_address || '';

  const isIdentityDirty =
    avatarSeed !== initialBlobState.seed ||
    selectedExpression !== initialBlobState.expressionKey ||
    selectedShape !== initialBlobState.shapeKey ||
    selectedGlow !== initialBlobState.glowKey ||
    animationMode !== initialBlobState.animMode;

  const isCommercialDirty =
    JSON.stringify(commercialProfile) !== JSON.stringify(initialCommercialProfile) ||
    contactName.trim() !== initialContactName.trim();

  const isWalletsDirty = JSON.stringify(wallets) !== initialWalletsJson || walletAddress !== initialWalletAddress;

  const persistWallets = async (updatedWallets: PayoutWalletItem[]) => {
    if (supplier?.id) {
      await saveSupplierWallets(supplier.id, updatedWallets);
    }
  };

  const handleSaveKycFiscal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;
    if (!kycFiscal.tax_id.trim() || !kycFiscal.legal_name.trim()) {
      setMessage({ type: 'error', text: 'El RUC / Tax ID y la Razón Social Legal son requisitos obligatorios.' });
      return;
    }
    if (!kycFiscal.terms_accepted) {
      setMessage({ type: 'error', text: 'Debes certificar la veracidad de la información fiscal declarada.' });
      return;
    }

    setIsSavingKyc(true);
    try {
      const res = await saveSupplierKycFiscal(supplier.id, kycFiscal);
      if (res.success && res.data) {
        setKycFiscal(res.data);
        setInitialKycFiscal(res.data);
        setMessage({
          type: 'success',
          text: '¡Información fiscal y cumplimiento KYC guardados exitosamente!',
        });
      } else {
        setMessage({ type: 'error', text: res.error || 'Error al guardar información fiscal.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error inesperado al guardar datos fiscales.' });
    } finally {
      setIsSavingKyc(false);
    }
  };

  const handleSaveCommercialProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;
    if (!commercialProfile.brand_name.trim()) {
      setMessage({ type: 'error', text: 'El Nombre Comercial de la Marca / Tienda es obligatorio.' });
      return;
    }

    setIsSavingCommercial(true);
    try {
      const res = await saveSupplierCommercialProfile(supplier.id, commercialProfile);

      // Sincronizar en tiempo real con la tabla suppliers (marca, contacto, teléfono)
      await supabase
        .from('suppliers')
        .update({
          company_name: commercialProfile.brand_name.trim(),
          contact_name: contactName.trim(),
          phone: commercialProfile.whatsapp_number.trim() || commercialProfile.customer_phone.trim(),
        })
        .eq('id', supplier.id);

      await refreshSupplier();

      if (res.success && res.data) {
        setCommercialProfile(res.data);
        setInitialCommercialProfile(res.data);
        setInitialContactName(contactName.trim());
        setCompanyName(commercialProfile.brand_name.trim());
        setMessage({
          type: 'success',
          text: '¡Datos comerciales de la marca guardados exitosamente!',
        });
      } else {
        setMessage({ type: 'error', text: res.error || 'Error al guardar datos comerciales.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error inesperado al guardar datos comerciales.' });
    } finally {
      setIsSavingCommercial(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', text: 'Por favor ingresa tu contraseña actual.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', text: 'La nueva contraseña debe tener un mínimo de 8 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeSupplierPassword(supplier.id, currentPassword, newPassword);
      if (res.success) {
        setPasswordFeedback({
          type: 'success',
          text: '¡Contraseña actualizada exitosamente! Ya puedes usar tu nueva clave en el próximo inicio de sesión.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordFeedback({ type: 'error', text: res.error || 'Error al actualizar contraseña.' });
      }
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', text: err.message || 'Error inesperado al cambiar contraseña.' });
    } finally {
      setIsChangingPassword(false);
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

  const handleSaveBlobatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const blobatarIdentifier = serializeBlobatar({
        seed: avatarSeed.trim() || commercialProfile.brand_name.trim() || companyName.trim() || 'NovaSats',
        expressionKey: selectedExpression,
        shapeKey: selectedShape,
        glowKey: selectedGlow,
        animMode: animationMode,
      });

      const { error } = await supabase
        .from('suppliers')
        .update({
          avatar_url: blobatarIdentifier,
        })
        .eq('id', supplier.id);

      if (error) throw error;

      setInitialBlobState(parseBlobatar(blobatarIdentifier, companyName || 'NovaSats'));
      await refreshSupplier();
      setMessage({
        type: 'success',
        text: '¡Identidad Visual & Blobatar personalizado guardados exitosamente!',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Error al guardar el icono Blobatar en el servidor.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWallets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const primaryWallet = wallets.find((w) => w.isPrimary);
      const activePayoutAddress = primaryWallet?.address || walletAddress.trim();

      const { error } = await supabase
        .from('suppliers')
        .update({
          wallet_address: activePayoutAddress,
        })
        .eq('id', supplier.id);

      if (error) throw error;

      await persistWallets(wallets);
      setInitialWalletsJson(JSON.stringify(wallets));
      await refreshSupplier();
      setMessage({
        type: 'success',
        text: '¡Billeteras de cobro guardadas exitosamente!',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Error al guardar billeteras de cobro.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVouchers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    setIsSaving(true);
    setMessage(null);

    try {
      await saveSupplierVoucherConfig(supplier.id, voucherConfig);
      setSupplierVoucherConfig(supplier.id, voucherConfig);
      setInitialVoucherConfig(voucherConfig);
      setMessage({
        type: 'success',
        text: '¡Preferencias de formatos de voucher guardadas exitosamente!',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Error al guardar configuración de vouchers.',
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

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.08] scrollbar-none">
          <button
            type="button"
            onClick={() => handleTabChange('identidad')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
              activeTab === 'identidad'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0a0f1d] text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/[0.06]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Identidad Visual & Blobatar</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('billeteras')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
              activeTab === 'billeteras'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0a0f1d] text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/[0.06]'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Billeteras & Cobros</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeTab === 'billeteras' ? 'bg-black/25 text-black font-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {wallets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('verificacion', 'comercial')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
              activeTab === 'verificacion'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'bg-[#0a0f1d] text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/[0.06]'
            }`}
          >
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            <span>Datos Fiscales & Comerciales</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              kycFiscal.is_verified
                ? activeTab === 'verificacion' ? 'bg-black/25 text-black font-black' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : activeTab === 'verificacion' ? 'bg-black/25 text-black font-black' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {kycFiscal.is_verified ? 'Verificado' : 'Pendiente'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('vouchers')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
              activeTab === 'vouchers'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#0a0f1d] text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/[0.06]'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Formatos de Voucher</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('seguridad')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
              activeTab === 'seguridad'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-[#0a0f1d] text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Zona de Seguridad</span>
          </button>
        </div>

        {/* TAB 1: IDENTIDAD VISUAL & BLOBATAR */}
        {activeTab === 'identidad' && (
          <form onSubmit={handleSaveBlobatar} className="space-y-8 w-full max-w-full">

            {/* SECTION 1: PERSONALIZADOR PROFESIONAL DE BLOBATAR */}
            <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 w-full">
            
            {/* Header with Title (Clean single save button at the bottom of the section) */}
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
            </div>

            {/* LIVE PREVIEW HERO BANNER */}
            <div className="bg-[#060911] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Main Large Blobatar Display */}
              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                <div className="relative group">
                  <Blobatar
                    name={avatarSeed || 'NovaSats'}
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
                    <h4 className="text-base font-black text-white">{avatarSeed || companyName || 'NovaSats Supplier'}</h4>
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
                    name={avatarSeed || 'NovaSats'}
                    blobatar={{ expression: activeExpression.expr, animate: getBlobatarAnimate(animationMode) }}
                    className={`w-12 h-12 ${activeShape.class} border ${activeGlow.border}`}
                  />
                  <span className="text-[10px] font-bold text-slate-300">Barra Lateral</span>
                  <span className="text-[9px] text-slate-500 font-mono">48 × 48 px</span>
                </div>

                {/* Product Detail context */}
                <div className="flex flex-col items-center gap-1.5 bg-[#0e1424] p-3 rounded-2xl border border-white/[0.06] text-center min-w-[90px]">
                  <Blobatar
                    name={avatarSeed || 'NovaSats'}
                    blobatar={{ expression: activeExpression.expr, animate: getBlobatarAnimate(animationMode) }}
                    className={`w-10 h-10 ${activeShape.class} border ${activeGlow.border}`}
                  />
                  <span className="text-[10px] font-bold text-slate-300">Ficha Producto</span>
                  <span className="text-[9px] text-slate-500 font-mono">40 × 40 px</span>
                </div>

                {/* Voucher context */}
                <div className="flex flex-col items-center gap-1.5 bg-[#0e1424] p-3 rounded-2xl border border-white/[0.06] text-center min-w-[90px]">
                  <Blobatar
                    name={avatarSeed || 'NovaSats'}
                    blobatar={{ expression: activeExpression.expr, animate: getBlobatarAnimate(animationMode) }}
                    className={`w-8 h-8 ${activeShape.class} border ${activeGlow.border}`}
                  />
                  <span className="text-[10px] font-bold text-slate-300">Voucher</span>
                  <span className="text-[9px] text-slate-500 font-mono">32 × 32 px</span>
                </div>

                {/* Store Catalog context */}
                <div className="flex flex-col items-center gap-1.5 bg-[#0e1424] p-3 rounded-2xl border border-white/[0.06] text-center min-w-[90px]">
                  <Blobatar
                    name={avatarSeed || 'NovaSats'}
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

          {/* Bottom Save Action Bar for Tab 1 */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={!isIdentityDirty || isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando en el Servidor...' : 'Guardar Identidad Visual & Blobatar'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: BILLETERAS & COBROS */}
      {activeTab === 'billeteras' && (
        <form onSubmit={handleSaveWallets} className="space-y-8 w-full max-w-full">
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

              {/* Action Buttons: Add Manual Wallet + Reown AppKit WalletConnect */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddWalletModalOpen(true)}
                  className="px-4 py-2 bg-[#0e1424] hover:bg-[#161f38] text-white font-bold text-xs rounded-xl border border-white/[0.1] hover:border-amber-500/40 transition flex items-center gap-1.5 active:scale-95 shadow-md"
                >
                  <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
                  <span>Agregar Otra Billetera Manualmente</span>
                </button>

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

            {/* Informational security note */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5 text-xs text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Los pagos de los compradores en la tienda se liquidarán de forma no custodial y transparente directo a tu billetera principal activa.
              </span>
            </div>
          </div>

          {/* Bottom Save Action Bar for Wallets */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={!isWalletsDirty || isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando en el Servidor...' : 'Guardar Billeteras de Cobro'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: VERIFICACIÓN OFICIAL DE PROVEEDOR */}
      {activeTab === 'verificacion' && (
        <div className="space-y-8 w-full max-w-full">
          
          {/* Sub-navegación entre Información Fiscal vs Datos Comerciales */}
          <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-[#060911] border border-white/[0.08] rounded-2xl">
            <button
              type="button"
              onClick={() => handleSubTabChange('fiscal')}
              className={`flex-1 w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                verifSubTab === 'fiscal'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Registro de Información Fiscal y Cumplimiento (KYC Proveedores)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubTabChange('comercial')}
              className={`flex-1 w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                verifSubTab === 'comercial'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>2. Datos Comerciales de la Empresa / Marca</span>
            </button>
          </div>

          {/* VISTA 1: REGISTRO DE INFORMACIÓN FISCAL Y CUMPLIMIENTO (KYC PROVEEDORES) */}
          {verifSubTab === 'fiscal' && (
            <>
              {/* Header & Official Status Banner */}
              <div className={`p-6 sm:p-8 rounded-3xl border-2 transition relative overflow-hidden shadow-2xl ${
                kycFiscal.is_verified
                  ? 'bg-gradient-to-br from-emerald-950/40 via-[#0a1b15] to-[#060911] border-emerald-500/40'
                  : 'bg-gradient-to-br from-amber-950/40 via-[#1a130a] to-[#060911] border-amber-500/40'
              }`}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
                      kycFiscal.is_verified
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10'
                    }`}>
                      {kycFiscal.is_verified ? (
                        <BadgeCheck className="w-8 h-8" />
                      ) : (
                        <Award className="w-8 h-8" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-xl font-black text-white font-heading">
                          {kycFiscal.is_verified
                            ? 'Proveedor Oficialmente Verificado & Acreditado'
                            : 'Acreditación y Verificación de Proveedor'}
                        </h3>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          kycFiscal.is_verified
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {kycFiscal.is_verified ? 'Acreditado Oficialmente' : 'Solicitud Pendiente'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                        {kycFiscal.is_verified
                          ? 'Tu comercio cuenta con la insignia de confianza de NovaSats. Tus productos, información fiscal y perfil de marca están respaldados y certificados en la plataforma.'
                          : 'Certifica tu identidad comercial y datos fiscales para activar la insignia de verificación oficial en tus productos y maximizar tus ventas.'}
                      </p>
                    </div>
                  </div>

                  {kycFiscal.is_verified && (
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 font-mono text-[11px] text-emerald-400 shrink-0">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400">Hash de Verificación:</span>
                      <span className="font-bold truncate block max-w-[200px]">{kycFiscal.verification_hash}</span>
                    </div>
                  )}
                </div>

                {/* Data Summary if Verified */}
                {kycFiscal.is_verified && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/[0.08] relative z-10">
                    <div className="p-3 bg-black/30 rounded-xl border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Razón Social Legal</span>
                      <span className="text-xs font-bold text-white truncate block mt-0.5">{kycFiscal.legal_name}</span>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">RUC / Tax ID</span>
                      <span className="text-xs font-bold text-white truncate block mt-0.5">{kycFiscal.tax_id}</span>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Jurisdicción / País</span>
                      <span className="text-xs font-bold text-white truncate block mt-0.5">{kycFiscal.country}</span>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Fecha de Validación</span>
                      <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                        {new Date(kycFiscal.verified_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Beneficios de la Verificación (KYC) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-white/[0.08] space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Insignia Oficial de Confianza</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tu marca e ítems mostrarán el badge de verificación en el Header, en la tienda y en el comprobante, inspirando total seguridad al comprador.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-white/[0.08] space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Prioridad en el Algoritmo</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tus productos tienen preferencia en los resultados de búsqueda, filtros destacados y catálogo general del marketplace.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-white/[0.08] space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pagos Cripto Respaldados</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Garantía de liquidación en Bitcoin y stablecoins con comprobantes digitales autoverificables sobre la blockchain.
                  </p>
                </div>
              </div>

              {/* FORMULARIO 1: REGISTRO DE INFORMACIÓN FISCAL Y CUMPLIMIENTO (KYC PROVEEDORES) */}
              <form onSubmit={handleSaveKycFiscal} className="bg-[#0a0f1d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Registro de Información Fiscal y Cumplimiento (KYC Proveedores)</span>
                    </h3>
                  <p className="text-xs text-slate-400">
                    Acreditación tributaria, personería jurídica y resolución fiscal ante SUNAT.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Razón Social / Nombre Legal Registrado *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={kycFiscal.legal_name}
                      onChange={(e) => setKycFiscal({ ...kycFiscal, legal_name: e.target.value })}
                      placeholder="Ej: Razón Social de la Empresa S.A.C."
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    RUC / Tax ID / Número de Identificación Tributaria *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={kycFiscal.tax_id}
                      onChange={(e) => setKycFiscal({ ...kycFiscal, tax_id: e.target.value.replace(/[^0-9A-Za-z-]/g, '') })}
                      placeholder="Ej: 20601234567"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    País o Jurisdicción Legal *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={kycFiscal.country}
                      onChange={(e) => setKycFiscal({ ...kycFiscal, country: e.target.value })}
                      placeholder="Ej: Perú, Colombia, México, España, USA"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Domicilio Fiscal Registrado *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={kycFiscal.business_address}
                      onChange={(e) => setKycFiscal({ ...kycFiscal, business_address: e.target.value })}
                      placeholder="Ej: Av. Principal 123, Oficina 404, Lima - Perú"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre del Representante Legal
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={kycFiscal.legal_representative_name}
                      onChange={(e) => setKycFiscal({ ...kycFiscal, legal_representative_name: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Documento de Identidad del Representante (DNI / Cédula / Pasaporte)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={kycFiscal.legal_representative_id_doc}
                      onChange={(e) => setKycFiscal({ ...kycFiscal, legal_representative_id_doc: e.target.value.replace(/[^0-9A-Za-z-]/g, '') })}
                      placeholder="Ej: 12345678"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Correo Electrónico Fiscal / Facturación *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={kycFiscal.fiscal_email}
                      onChange={(e) => setKycFiscal({ ...kycFiscal, fiscal_email: e.target.value.trim() })}
                      placeholder="facturacion@empresa.com"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teléfono Fiscal Oficial (Solo Números) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      inputMode="tel"
                      required
                      value={kycFiscal.fiscal_phone}
                      onChange={(e) => setKycFiscal({ ...kycFiscal, fiscal_phone: e.target.value.replace(/[^0-9+\s-]/g, '') })}
                      placeholder="+51 987 654 321"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Resolución / Autorización Tributaria SUNAT
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={kycFiscal.tax_resolution}
                      onChange={(e) => setKycFiscal({ ...kycFiscal, tax_resolution: e.target.value })}
                      placeholder="Resolución de Superintendencia N° 097-2012/SUNAT"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Comprobante Oficial Emitido
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={kycFiscal.official_receipt_type}
                      onChange={(e) => setKycFiscal({ ...kycFiscal, official_receipt_type: e.target.value })}
                      placeholder="COMPROBANTE ELECTRÓNICO DE PAGO BITCOIN ON-CHAIN"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Declaración Jurada */}
              <div className="p-4 rounded-2xl bg-[#060911] border border-white/[0.08] space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={kycFiscal.terms_accepted}
                    onChange={(e) => setKycFiscal({ ...kycFiscal, terms_accepted: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-emerald-500 shrink-0"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    Declaro bajo juramento que represento legalmente a esta persona jurídica/natural con negocio, que los datos fiscales suministrados son fidedignos y que todos los comprobantes emitidos corresponden a operaciones comerciales lícitas dentro de NovaSats Marketplace.
                  </span>
                </label>
              </div>

              {/* Submit Button KYC */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!isKycDirty || isSavingKyc}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSavingKyc
                      ? 'Guardando...'
                      : 'Guardar Información Fiscal (KYC)'}
                  </span>
                </button>
              </div>
            </form>
          </>
          )}

          {/* VISTA 2: DATOS COMERCIALES DE LA EMPRESA / MARCA */}
          {verifSubTab === 'comercial' && (
            <>
              {/* Header & Commercial Status Banner */}
              <div className="p-6 sm:p-8 rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-[#1a130a] to-[#060911] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/40 bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/10">
                      <Store className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-xl font-black text-white font-heading">
                          Datos Comerciales & Presencia de Tienda
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40">
                          Perfil Público de Marca
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                        Configura la información comercial de tu tienda, canales oficiales de atención al cliente y enlaces para conectar con tus compradores en NovaSats Marketplace.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Beneficios Comerciales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-white/[0.08] space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Identidad de Marca & Confianza Comercial</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tu nombre comercial, logotipo y descripción se exhiben de forma destacada en la tienda y en los productos, fortaleciendo tu reputación ante los compradores.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-white/[0.08] space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Atención al Cliente & Canales Directos</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Comunícate directamente con tus clientes a través de WhatsApp de ventas, teléfono y correo de soporte para resolver dudas y aumentar tus conversiones.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-white/[0.08] space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Presencia Digital & Comunidad Web3</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Enlaza tu tienda online oficial y tus comunidades en Twitter/X, Telegram y Discord para construir lealtad y expandir el alcance de tu marca.
                  </p>
                </div>
              </div>

              {/* FORMULARIO 2: DATOS COMERCIALES DE LA EMPRESA / MARCA */}
              <form onSubmit={handleSaveCommercialProfile} className="bg-[#0a0f1d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                  <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Datos Comerciales de la Empresa / Marca</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Marca de tienda, canales de atención al cliente y redes sociales visibles para tus compradores en NovaSats.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nombre Comercial de la Marca / Tienda *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={commercialProfile.brand_name}
                        onChange={(e) => {
                          setCommercialProfile({ ...commercialProfile, brand_name: e.target.value });
                          setCompanyName(e.target.value);
                        }}
                        placeholder="Ej: SatoshiForge Official"
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
                        placeholder="Ej: Carlos Rojas"
                        className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Giro Comercial / Actividad Económica *
                  </label>
                  <div className="relative">
                    <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={commercialProfile.commercial_activity}
                      onChange={(e) => setCommercialProfile({ ...commercialProfile, commercial_activity: e.target.value })}
                      placeholder="Ej: Venta de productos, tecnología y servicios"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Descripción Comercial / Propuesta de Valor
                  </label>
                  <textarea
                    rows={3}
                    value={commercialProfile.commercial_description}
                    onChange={(e) => setCommercialProfile({ ...commercialProfile, commercial_description: e.target.value })}
                    placeholder="Describe los productos, servicios y valor diferencial que ofreces a los clientes de NovaSats..."
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dirección Comercial / Despacho Físico / Almacén *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={commercialProfile.commercial_address}
                      onChange={(e) => setCommercialProfile({ ...commercialProfile, commercial_address: e.target.value })}
                      placeholder="Ej: Av. Principal 123, Módulo 4, Lima"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teléfono Comercial de Atención al Cliente (Solo Números) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      inputMode="tel"
                      required
                      value={commercialProfile.customer_phone}
                      onChange={(e) => setCommercialProfile({ ...commercialProfile, customer_phone: e.target.value.replace(/[^0-9+\s-]/g, '') })}
                      placeholder="+51 987 654 321"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp Directo de Soporte y Ventas (Solo Números) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      inputMode="tel"
                      required
                      value={commercialProfile.whatsapp_number}
                      onChange={(e) => setCommercialProfile({ ...commercialProfile, whatsapp_number: e.target.value.replace(/[^0-9+\s-]/g, '') })}
                      placeholder="+51 987 654 321"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Público de Soporte al Cliente *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={commercialProfile.support_email}
                      onChange={(e) => setCommercialProfile({ ...commercialProfile, support_email: e.target.value.trim() })}
                      placeholder="soporte@empresa.com"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sitio Web Oficial o Tienda Online
                  </label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="url"
                      value={commercialProfile.website_url}
                      onChange={(e) => setCommercialProfile({ ...commercialProfile, website_url: e.target.value })}
                      placeholder="https://novasats.vercel.app"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Usuario de Red Social X / Twitter
                  </label>
                  <div className="relative">
                    <Share2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={commercialProfile.social_twitter || ''}
                      onChange={(e) => setCommercialProfile({ ...commercialProfile, social_twitter: e.target.value })}
                      placeholder="@MiMarcaOficial"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Canal o Usuario de Telegram
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={commercialProfile.social_telegram || ''}
                      onChange={(e) => setCommercialProfile({ ...commercialProfile, social_telegram: e.target.value })}
                      placeholder="t.me/mimarca"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Comunidad o Servidor de Discord
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={commercialProfile.social_discord || ''}
                      onChange={(e) => setCommercialProfile({ ...commercialProfile, social_discord: e.target.value })}
                      placeholder="discord.gg/mimarca"
                      className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button Commercial */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!isCommercialDirty || isSavingCommercial}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSavingCommercial
                      ? 'Guardando...'
                      : 'Guardar Datos Comerciales de la Marca'}
                  </span>
                </button>
              </div>
            </form>
          </>
          )}

        </div>
      )}

      {/* TAB 4: FORMATOS DE VOUCHER */}
      {activeTab === 'vouchers' && (
        <form onSubmit={handleSaveVouchers} className="space-y-8 w-full max-w-full">
          {/* Configuración de Comprobantes & Vouchers para Clientes */}
          <div className="p-6 rounded-2xl bg-[#0c1222] border border-white/[0.08] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">
                  Formatos de Comprobante / Voucher Disponibles para Clientes
                </h3>
                <p className="text-xs text-slate-400">
                  Selecciona si tus compradores tendrán acceso a ambos formatos o únicamente a uno de ellos:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Opción 1: Vista previa del voucher · 80mm */}
              <label className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition select-none ${
                voucherConfig.allow80mm 
                  ? 'bg-amber-500/10 border-amber-500/40 text-white' 
                  : 'bg-white/[0.02] border-white/[0.08] text-slate-400 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={voucherConfig.allow80mm}
                  onChange={(e) => {
                    if (!e.target.checked && !voucherConfig.allowDigital) {
                      setMessage({ type: 'error', text: 'Debes mantener habilitado al menos un formato de voucher para tus clientes.' });
                      return;
                    }
                    const next = { ...voucherConfig, allow80mm: e.target.checked };
                    setVoucherConfig(next);
                    if (supplier?.id) {
                      setSupplierVoucherConfig(supplier.id, next);
                      saveSupplierVoucherConfig(supplier.id, next);
                    }
                  }}
                  className="w-4 h-4 mt-0.5 rounded border-white/20 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="font-bold text-xs block text-white">Vista previa del voucher · 80mm</span>
                  <span className="text-[11px] text-slate-400 leading-relaxed block mt-1">
                    Ticket térmico POS de 80mm con vista previa interactiva en Laptop/PC y descarga directa de 1 toque en celulares. Tipografía ultra nítida optimizada.
                  </span>
                </div>
              </label>

              {/* Opción 2: Vista previa del A4 */}
              <label className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition select-none ${
                voucherConfig.allowDigital 
                  ? 'bg-blue-500/10 border-blue-500/40 text-white' 
                  : 'bg-white/[0.02] border-white/[0.08] text-slate-400 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={voucherConfig.allowDigital}
                  onChange={(e) => {
                    if (!e.target.checked && !voucherConfig.allow80mm) {
                      setMessage({ type: 'error', text: 'Debes mantener habilitado al menos un formato de voucher para tus clientes.' });
                      return;
                    }
                    const next = { ...voucherConfig, allowDigital: e.target.checked };
                    setVoucherConfig(next);
                    if (supplier?.id) {
                      setSupplierVoucherConfig(supplier.id, next);
                      saveSupplierVoucherConfig(supplier.id, next);
                    }
                  }}
                  className="w-4 h-4 mt-0.5 rounded border-white/20 bg-slate-900 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-xs block text-white">Vista previa del A4</span>
                  <span className="text-[11px] text-slate-400 leading-relaxed block mt-1">
                    Comprobante electrónico oficial en hoja tamaño A4 con información fiscal completa, cálculo de I.G.V., vista previa en Laptop/PC y descarga directa en celulares.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Bottom Save Action Bar for Vouchers */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={!isVoucherDirty || isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando en el Servidor...' : 'Guardar Preferencias de Voucher'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: ZONA DE SEGURIDAD */}
      {activeTab === 'seguridad' && (
        <div className="space-y-8 w-full max-w-full">
          {/* SECCIÓN 1: CAMBIAR CONTRASEÑA DE ACCESO DEL PROVEEDOR */}
          <form onSubmit={handleChangePassword} className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1d] border border-white/[0.08] shadow-2xl space-y-6">
            <div className="flex items-start gap-4 border-b border-white/[0.08] pb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <span>Cambiar Contraseña de Acceso del Proveedor</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Actualiza tu contraseña secreta de inicio de sesión. La nueva clave se actualiza directamente en tu cuenta.
                </p>
              </div>
            </div>

            {/* Password Feedback */}
            {passwordFeedback && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold transition-all shadow-md ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span>{passwordFeedback.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Contraseña Actual */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    title={showCurrentPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nueva Contraseña (mínimo 8 caracteres) *
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    title={showNewPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    title={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>{isChangingPassword ? 'Actualizando Contraseña...' : 'Actualizar Contraseña de Proveedor'}</span>
              </button>
            </div>
          </form>

          {/* SECCIÓN 2: ZONA DE PELIGRO: ELIMINAR CUENTA */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#13070b] border-2 border-rose-500/30 space-y-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  Zona de Peligro: Eliminar Cuenta de Proveedor
                </h3>
                <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                  Esta acción es destructiva e irreversible. Si eliminas tu cuenta, todos tus productos activos y archivados se eliminarán inmediatamente del catálogo de NovaSats Marketplace.
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
      )}

      {/* Modal Agregar Billetera Manualmente */}
      {isAddWalletModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0a0f1d] border border-white/[0.1] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Agregar Billetera Manualmente
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registra una nueva dirección para recibir pagos de ventas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWalletModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Etiqueta / Nombre Descriptivo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cold Storage BTC, Binance, Trezor"
                  value={newWalletLabel}
                  onChange={(e) => setNewWalletLabel(e.target.value)}
                  className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Red Blockchain
                </label>
                <select
                  value={newWalletNetwork}
                  onChange={(e) => setNewWalletNetwork(e.target.value)}
                  className="w-full bg-[#060911] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dirección Pública de la Billetera *
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="0x... o bc1q..."
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/[0.08] bg-[#060911]/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddWalletModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleAddWallet()}
                disabled={!newWalletAddress.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Guardar Billetera</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </SupplierLayout>
  );
};
