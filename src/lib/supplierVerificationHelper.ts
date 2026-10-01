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
  isVerified: true,
  taxId: '20601234567',
  legalName: 'TechGlobal Hardware & Cryptowear S.A.C.',
  nombreComercial: 'TechGlobal Hardware & Cryptowear',
  country: 'Perú',
  businessAddress: 'Av. Blockchain 404, San Isidro, Lima - Perú',
  telefono: '+51 987 654 321',
  whatsapp: '+51 987 654 321',
  emailFacturacion: 'proveedor@novasats.com',
  emailSoporte: 'soporte@novasats.com',
  website: 'https://novasats.vercel.app',
  giroComercial: 'Venta de Hardware Cripto, Nodos y Plataforma de Pasarela Web3',
  autorizacionSunat: 'Resolución de Superintendencia N° 097-2012/SUNAT',
  tipoComprobante: 'COMPROBANTE ELECTRÓNICO DE PAGO BITCOIN ON-CHAIN',
  verifiedAt: '2026-01-15T10:00:00Z',
  verificationHash: '0x7f9a2b8c4d1e3f5a6b7c8d9e0f1a2b3c4d5e6f7a',
};

export function getSupplierVerification(supplierId?: string): SupplierVerificationInfo {
  if (!supplierId) {
    return { ...DEFAULT_SUPPLIER_VERIFICATION };
  }
  try {
    const raw = localStorage.getItem(`novasats_supplier_verification_${supplierId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SUPPLIER_VERIFICATION,
        ...parsed,
      };
    }
  } catch {}
  return { ...DEFAULT_SUPPLIER_VERIFICATION };
}

export function saveSupplierVerification(supplierId: string, data: SupplierVerificationInfo) {
  try {
    localStorage.setItem(`novasats_supplier_verification_${supplierId}`, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving supplier verification:', err);
  }
}
