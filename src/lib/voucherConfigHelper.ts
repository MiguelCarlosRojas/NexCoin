export interface SupplierVoucherConfig {
  allow80mm: boolean;
  allowDigital: boolean;
}

export function getSupplierVoucherConfig(supplierId?: string): SupplierVoucherConfig {
  if (!supplierId) {
    return { allow80mm: true, allowDigital: true };
  }
  try {
    const raw = localStorage.getItem(`novasats_voucher_config_${supplierId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        allow80mm: parsed.allow80mm !== false,
        allowDigital: parsed.allowDigital !== false,
      };
    }
  } catch {}
  return { allow80mm: true, allowDigital: true };
}

export function setSupplierVoucherConfig(supplierId: string, config: SupplierVoucherConfig) {
  try {
    localStorage.setItem(`novasats_voucher_config_${supplierId}`, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving supplier voucher config:', err);
  }
}
