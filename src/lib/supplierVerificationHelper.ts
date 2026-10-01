import { 
  fetchSupplierKycFiscal, 
  saveSupplierKycFiscal, 
  fetchSupplierCommercialProfile, 
  saveSupplierCommercialProfile, 
  DEFAULT_KYC_FISCAL, 
  DEFAULT_COMMERCIAL_PROFILE 
} from './supplierDatabaseService';

export interface SupplierVerificationInfo {
  isVerified: boolean;
  taxId: string; // RUC / Tax ID
  legalName: string; // Razón Social
  nombreComercial?: string; // Nombre Comercial
  country: string; // País o Jurisdicción
  businessAddress: string; // Dirección Fiscal
  telefono?: string; // Teléfono
  whatsapp?: string; // WhatsApp
  emailFacturacion?: string; // Correo de Facturación
  emailSoporte?: string; // Correo de Soporte
  website: string; // Sitio Web
  giroComercial?: string; // Giro Comercial
  autorizacionSunat?: string; // Autorización SUNAT
  tipoComprobante?: string; // Tipo de Comprobante
  verifiedAt?: string;
  verificationHash?: string;
}

export const DEFAULT_SUPPLIER_VERIFICATION: SupplierVerificationInfo = {
  isVerified: false,
  taxId: DEFAULT_KYC_FISCAL.tax_id,
  legalName: DEFAULT_KYC_FISCAL.legal_name,
  nombreComercial: DEFAULT_COMMERCIAL_PROFILE.brand_name,
  country: DEFAULT_KYC_FISCAL.country,
  businessAddress: DEFAULT_KYC_FISCAL.business_address,
  telefono: DEFAULT_COMMERCIAL_PROFILE.customer_phone,
  whatsapp: DEFAULT_COMMERCIAL_PROFILE.whatsapp_number,
  emailFacturacion: DEFAULT_KYC_FISCAL.fiscal_email,
  emailSoporte: DEFAULT_COMMERCIAL_PROFILE.support_email,
  website: DEFAULT_COMMERCIAL_PROFILE.website_url,
  giroComercial: DEFAULT_COMMERCIAL_PROFILE.commercial_activity,
  autorizacionSunat: DEFAULT_KYC_FISCAL.tax_resolution,
  tipoComprobante: DEFAULT_KYC_FISCAL.official_receipt_type,
  verifiedAt: DEFAULT_KYC_FISCAL.verified_at || undefined,
  verificationHash: DEFAULT_KYC_FISCAL.verification_hash || undefined,
};

// In-memory runtime cache (Zero localStorage)
const runtimeVerificationCache: Record<string, SupplierVerificationInfo> = {};

export function getSupplierVerification(supplierId?: string): SupplierVerificationInfo {
  if (!supplierId) {
    return { ...DEFAULT_SUPPLIER_VERIFICATION };
  }
  if (runtimeVerificationCache[supplierId]) {
    return runtimeVerificationCache[supplierId];
  }
  return { ...DEFAULT_SUPPLIER_VERIFICATION };
}

export async function fetchSupplierVerificationFromDb(supplierId: string): Promise<SupplierVerificationInfo> {
  if (!supplierId) return { ...DEFAULT_SUPPLIER_VERIFICATION };
  try {
    const [kyc, comm] = await Promise.all([
      fetchSupplierKycFiscal(supplierId),
      fetchSupplierCommercialProfile(supplierId),
    ]);

    const result: SupplierVerificationInfo = {
      isVerified: kyc.is_verified,
      taxId: kyc.tax_id,
      legalName: kyc.legal_name,
      nombreComercial: comm.brand_name || kyc.legal_name,
      country: kyc.country,
      businessAddress: kyc.business_address,
      telefono: comm.customer_phone || kyc.fiscal_phone,
      whatsapp: comm.whatsapp_number || kyc.fiscal_phone,
      emailFacturacion: kyc.fiscal_email,
      emailSoporte: comm.support_email,
      website: comm.website_url,
      giroComercial: comm.commercial_activity,
      autorizacionSunat: kyc.tax_resolution,
      tipoComprobante: kyc.official_receipt_type,
      verifiedAt: kyc.verified_at || undefined,
      verificationHash: kyc.verification_hash || undefined,
    };

    runtimeVerificationCache[supplierId] = result;
    return result;
  } catch (err) {
    console.error('Error fetching verification from Supabase:', err);
    return { ...DEFAULT_SUPPLIER_VERIFICATION };
  }
}

export async function saveSupplierVerification(supplierId: string, data: SupplierVerificationInfo): Promise<void> {
  // Update in-memory cache
  runtimeVerificationCache[supplierId] = { ...data };

  // Persist to Supabase in both kyc and commercial tables
  await Promise.all([
    saveSupplierKycFiscal(supplierId, {
      legal_name: data.legalName,
      tax_id: data.taxId,
      country: data.country,
      business_address: data.businessAddress,
      tax_resolution: data.autorizacionSunat,
      official_receipt_type: data.tipoComprobante,
      fiscal_email: data.emailFacturacion,
      fiscal_phone: data.telefono,
      is_verified: data.isVerified,
      verified_at: data.verifiedAt,
      verification_hash: data.verificationHash,
    }),
    saveSupplierCommercialProfile(supplierId, {
      brand_name: data.nombreComercial || data.legalName,
      commercial_activity: data.giroComercial,
      website_url: data.website,
      support_email: data.emailSoporte,
      customer_phone: data.telefono,
      whatsapp_number: data.whatsapp,
    }),
  ]);
}
