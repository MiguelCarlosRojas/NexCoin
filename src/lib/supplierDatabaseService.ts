import { supabase } from './supabaseClient';

// ============================================================================
// 1. REGISTRO DE INFORMACIÓN FISCAL Y CUMPLIMIENTO (KYC PROVEEDORES)
// ============================================================================
export interface SupplierKycFiscal {
  id?: string;
  supplier_id: string;
  legal_name: string; // Razón Social / Nombre Legal Registrado
  tax_id: string; // RUC / Tax ID / NIF
  country: string; // País o Jurisdicción Legal
  business_address: string; // Domicilio Fiscal Registrado
  legal_representative_name: string; // Representante Legal
  legal_representative_id_doc: string; // DNI / Cédula / Pasaporte
  tax_resolution: string; // Resolución o Autorización SUNAT
  official_receipt_type: string; // Tipo de Comprobante Oficial
  fiscal_email: string; // Correo de Notificaciones Fiscales / Facturación
  fiscal_phone: string; // Teléfono Fiscal Oficial
  is_verified: boolean; // Estado de Verificación Oficial
  verified_at?: string | null;
  verification_hash?: string | null;
  terms_accepted: boolean;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_KYC_FISCAL: Omit<SupplierKycFiscal, 'supplier_id'> = {
  legal_name: '',
  tax_id: '',
  country: '',
  business_address: '',
  legal_representative_name: '',
  legal_representative_id_doc: '',
  tax_resolution: '',
  official_receipt_type: '',
  fiscal_email: '',
  fiscal_phone: '',
  is_verified: false,
  verified_at: null,
  verification_hash: null,
  terms_accepted: false,
};

export async function fetchSupplierKycFiscal(supplierId: string): Promise<SupplierKycFiscal> {
  try {
    const { data, error } = await supabase
      .from('supplier_kyc_fiscal')
      .select('*')
      .eq('supplier_id', supplierId)
      .maybeSingle();

    if (error) {
      console.warn('supplier_kyc_fiscal not found or awaiting migration:', error.message);
      return { ...DEFAULT_KYC_FISCAL, supplier_id: supplierId };
    }

    if (data) return data as SupplierKycFiscal;
    return { ...DEFAULT_KYC_FISCAL, supplier_id: supplierId };
  } catch (err) {
    console.error('Error fetching KYC fiscal data from Supabase:', err);
    return { ...DEFAULT_KYC_FISCAL, supplier_id: supplierId };
  }
}

export async function saveSupplierKycFiscal(
  supplierId: string,
  payload: Partial<SupplierKycFiscal>
): Promise<{ success: boolean; data?: SupplierKycFiscal; error?: string }> {
  try {
    const record = {
      supplier_id: supplierId,
      legal_name: payload.legal_name?.trim() || '',
      tax_id: payload.tax_id?.trim() || '',
      country: payload.country?.trim() || '',
      business_address: payload.business_address?.trim() || '',
      legal_representative_name: payload.legal_representative_name?.trim() || '',
      legal_representative_id_doc: payload.legal_representative_id_doc?.trim() || '',
      tax_resolution: payload.tax_resolution?.trim() || '',
      official_receipt_type: payload.official_receipt_type?.trim() || '',
      fiscal_email: payload.fiscal_email?.trim() || '',
      fiscal_phone: payload.fiscal_phone?.trim() || '',
      is_verified: payload.is_verified ?? true,
      verified_at: payload.verified_at || new Date().toISOString(),
      verification_hash: payload.verification_hash || `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      terms_accepted: payload.terms_accepted ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('supplier_kyc_fiscal')
      .upsert(record, { onConflict: 'supplier_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting supplier_kyc_fiscal in Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SupplierKycFiscal };
  } catch (err: any) {
    console.error('Unexpected error saving KYC fiscal data:', err);
    return { success: false, error: err.message || 'Error de conexión con la base de datos' };
  }
}

// ============================================================================
// 2. DATOS COMERCIALES DE LA EMPRESA / MARCA (PÚBLICOS Y DE TIENDA)
// ============================================================================
export interface SupplierCommercialProfile {
  id?: string;
  supplier_id: string;
  brand_name: string; // Nombre Comercial de la Marca
  commercial_activity: string; // Giro Comercial / Actividad Económica
  website_url: string; // Sitio Web Oficial o Tienda Online
  support_email: string; // Correo de Soporte al Cliente
  customer_phone: string; // Teléfono Comercial
  whatsapp_number: string; // WhatsApp de Contacto Directo
  commercial_address: string; // Dirección Comercial / Tienda o Almacén
  social_twitter?: string; // Redes Sociales
  social_telegram?: string;
  social_discord?: string;
  commercial_description: string; // Descripción Comercial de la Marca
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_COMMERCIAL_PROFILE: Omit<SupplierCommercialProfile, 'supplier_id'> = {
  brand_name: '',
  commercial_activity: '',
  website_url: '',
  support_email: '',
  customer_phone: '',
  whatsapp_number: '',
  commercial_address: '',
  social_twitter: '',
  social_telegram: '',
  social_discord: '',
  commercial_description: '',
};

export async function fetchSupplierCommercialProfile(supplierId: string): Promise<SupplierCommercialProfile> {
  try {
    const { data, error } = await supabase
      .from('supplier_commercial_profiles')
      .select('*')
      .eq('supplier_id', supplierId)
      .maybeSingle();

    if (error) {
      console.warn('supplier_commercial_profiles not found or awaiting migration:', error.message);
      return { ...DEFAULT_COMMERCIAL_PROFILE, supplier_id: supplierId };
    }

    if (data) return data as SupplierCommercialProfile;
    return { ...DEFAULT_COMMERCIAL_PROFILE, supplier_id: supplierId };
  } catch (err) {
    console.error('Error fetching commercial profile from Supabase:', err);
    return { ...DEFAULT_COMMERCIAL_PROFILE, supplier_id: supplierId };
  }
}

export async function saveSupplierCommercialProfile(
  supplierId: string,
  payload: Partial<SupplierCommercialProfile>
): Promise<{ success: boolean; data?: SupplierCommercialProfile; error?: string }> {
  try {
    const record = {
      supplier_id: supplierId,
      brand_name: payload.brand_name?.trim() || '',
      commercial_activity: payload.commercial_activity?.trim() || '',
      website_url: payload.website_url?.trim() || '',
      support_email: payload.support_email?.trim() || '',
      customer_phone: payload.customer_phone?.trim() || '',
      whatsapp_number: payload.whatsapp_number?.trim() || '',
      commercial_address: payload.commercial_address?.trim() || '',
      social_twitter: payload.social_twitter?.trim() || '',
      social_telegram: payload.social_telegram?.trim() || '',
      social_discord: payload.social_discord?.trim() || '',
      commercial_description: payload.commercial_description?.trim() || '',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('supplier_commercial_profiles')
      .upsert(record, { onConflict: 'supplier_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting supplier_commercial_profiles in Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SupplierCommercialProfile };
  } catch (err: any) {
    console.error('Unexpected error saving commercial profile in Supabase:', err);
    return { success: false, error: err.message || 'Error de conexión con la base de datos' };
  }
}

// ============================================================================
// 3. BILLETERAS DE RECAUDACIÓN (SUBTABLA supplier_wallets)
// ============================================================================
export interface SupplierWalletRecord {
  id: string;
  supplier_id: string;
  address: string;
  label: string;
  network: string;
  is_primary: boolean;
  added_at: string;
  created_at?: string;
}

export async function fetchSupplierWallets(supplierId: string): Promise<SupplierWalletRecord[]> {
  try {
    const { data, error } = await supabase
      .from('supplier_wallets')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('is_primary', { ascending: false })
      .order('added_at', { ascending: false });

    if (error) {
      console.warn('supplier_wallets not found or awaiting migration:', error.message);
      return [];
    }

    return (data || []) as SupplierWalletRecord[];
  } catch (err) {
    console.error('Error fetching supplier wallets from Supabase:', err);
    return [];
  }
}

export async function saveSupplierWallets(
  supplierId: string,
  wallets: Array<{ id?: string; address: string; label: string; network: string; isPrimary: boolean; addedAt?: string }>
): Promise<{ success: boolean; data?: SupplierWalletRecord[]; error?: string }> {
  try {
    // 1. Delete existing wallets for this supplier to maintain clean state
    await supabase.from('supplier_wallets').delete().eq('supplier_id', supplierId);

    // 2. Insert new wallets
    const records = wallets.map((w) => ({
      supplier_id: supplierId,
      address: w.address.trim(),
      label: w.label.trim() || 'Billetera de Cobro',
      network: w.network || 'Ethereum / EVM',
      is_primary: Boolean(w.isPrimary),
      added_at: w.addedAt || new Date().toISOString(),
    }));

    if (records.length > 0) {
      const { data, error } = await supabase
        .from('supplier_wallets')
        .insert(records)
        .select();

      if (error) {
        console.error('Error inserting supplier wallets in Supabase:', error);
        return { success: false, error: error.message };
      }

      // Also sync primary wallet with suppliers.wallet_address
      const primaryWallet = records.find((r) => r.is_primary) || records[0];
      if (primaryWallet) {
        await supabase
          .from('suppliers')
          .update({ wallet_address: primaryWallet.address })
          .eq('id', supplierId);
      }

      return { success: true, data: (data || []) as SupplierWalletRecord[] };
    }

    return { success: true, data: [] };
  } catch (err: any) {
    console.error('Unexpected error saving supplier wallets:', err);
    return { success: false, error: err.message || 'Error al guardar billeteras' };
  }
}

// ============================================================================
// 4. CONFIGURACIÓN DE FORMATOS DE VOUCHER (supplier_voucher_configs)
// ============================================================================
export interface SupplierVoucherConfigRecord {
  id?: string;
  supplier_id: string;
  allow_80mm: boolean;
  allow_digital: boolean;
  default_format: '80mm' | 'digital';
  created_at?: string;
  updated_at?: string;
}

export async function fetchSupplierVoucherConfig(supplierId: string): Promise<SupplierVoucherConfigRecord> {
  try {
    const { data, error } = await supabase
      .from('supplier_voucher_configs')
      .select('*')
      .eq('supplier_id', supplierId)
      .maybeSingle();

    if (error || !data) {
      return {
        supplier_id: supplierId,
        allow_80mm: true,
        allow_digital: true,
        default_format: '80mm',
      };
    }

    return data as SupplierVoucherConfigRecord;
  } catch (err) {
    return {
      supplier_id: supplierId,
      allow_80mm: true,
      allow_digital: true,
      default_format: '80mm',
    };
  }
}

export async function saveSupplierVoucherConfig(
  supplierId: string,
  config: { allow80mm: boolean; allowDigital: boolean; defaultFormat?: '80mm' | 'digital' }
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      supplier_id: supplierId,
      allow_80mm: config.allow80mm,
      allow_digital: config.allowDigital,
      default_format: config.defaultFormat || '80mm',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('supplier_voucher_configs')
      .upsert(payload, { onConflict: 'supplier_id' });

    if (error) {
      console.error('Error upserting voucher config in Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error saving voucher config in Supabase:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// 5. CAMBIO DE CONTRASEÑA EN SUPABASE (suppliers.password)
// ============================================================================
export async function changeSupplierPassword(
  supplierId: string,
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify current password
    const { data: currentData, error: fetchErr } = await supabase
      .from('suppliers')
      .select('password')
      .eq('id', supplierId)
      .single();

    if (fetchErr || !currentData) {
      return { success: false, error: 'No se pudo verificar la cuenta del proveedor en el sistema.' };
    }

    if (currentData.password !== currentPass) {
      return { success: false, error: 'La contraseña actual ingresada es incorrecta.' };
    }

    // 2. Validate new password strength
    if (newPass.length < 8) {
      return { success: false, error: 'La nueva contraseña debe tener un mínimo de 8 caracteres.' };
    }

    // 3. Update password in database
    const { error: updateErr } = await supabase
      .from('suppliers')
      .update({
        password: newPass,
        updated_at: new Date().toISOString(),
      })
      .eq('id', supplierId);

    if (updateErr) {
      return { success: false, error: updateErr.message || 'Error al actualizar la contraseña en el sistema.' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error inesperado al cambiar contraseña.' };
  }
}

// ============================================================================
// 6. NOTIFICACIONES LEÍDAS EN SUPABASE (supplier_notifications_read)
// ============================================================================
export async function fetchSupplierReadNotificationIds(supplierId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('supplier_notifications_read')
      .select('notification_id')
      .eq('supplier_id', supplierId);

    if (error || !data) return [];
    return data.map((d: any) => d.notification_id);
  } catch {
    return [];
  }
}

export async function markSupplierNotificationAsReadInDb(supplierId: string, notificationId: string): Promise<void> {
  try {
    await supabase
      .from('supplier_notifications_read')
      .upsert({ supplier_id: supplierId, notification_id: notificationId, read_at: new Date().toISOString() });
  } catch {}
}

export async function markAllSupplierNotificationsAsReadInDb(supplierId: string, notificationIds: string[]): Promise<void> {
  try {
    const records = notificationIds.map((id) => ({
      supplier_id: supplierId,
      notification_id: id,
      read_at: new Date().toISOString(),
    }));
    await supabase.from('supplier_notifications_read').upsert(records);
  } catch {}
}
