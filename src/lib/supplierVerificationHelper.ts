export interface SupplierVerificationInfo {
  isVerified: boolean;
  taxId: string;
  legalName: string;
  country: string;
  businessAddress: string;
  website: string;
  verifiedAt?: string;
  verificationHash?: string;
}

export function getSupplierVerification(supplierId?: string): SupplierVerificationInfo {
  if (!supplierId) {
    return {
      isVerified: true,
      taxId: '20601234567',
      legalName: 'TechGlobal Hardware & Cryptowear S.A.C.',
      country: 'Perú',
      businessAddress: 'Av. Blockchain 404, San Isidro, Lima',
      website: 'https://nex-coin-rho.vercel.app',
      verifiedAt: '2026-01-15T10:00:00Z',
      verificationHash: '0x7f9a2b8c4d1e3f5a6b7c8d9e0f1a2b3c4d5e6f7a',
    };
  }
  try {
    const raw = localStorage.getItem(`nexcoin_supplier_verification_${supplierId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    isVerified: true,
    taxId: '20601234567',
    legalName: 'TechGlobal Hardware & Cryptowear S.A.C.',
    country: 'Perú',
    businessAddress: 'Av. Blockchain 404, San Isidro, Lima',
    website: 'https://nex-coin-rho.vercel.app',
    verifiedAt: '2026-01-15T10:00:00Z',
    verificationHash: '0x7f9a2b8c4d1e3f5a6b7c8d9e0f1a2b3c4d5e6f7a',
  };
}

export function saveSupplierVerification(supplierId: string, data: SupplierVerificationInfo) {
  try {
    localStorage.setItem(`nexcoin_supplier_verification_${supplierId}`, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving supplier verification:', err);
  }
}
